// Package services – email.go
// Implements the Resend-backed email service for Gita Daily.
//
// Responsibilities:
//  1. SendEmail         – thin HTTP wrapper over Resend REST API
//  2. BuildShlokEmailHTML – renders a rich HTML email for a given Gita verse
//  3. HMAC-based unsubscribe tokens (GenerateUnsubscribeToken / VerifyUnsubscribeToken)
package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"bgs/internal/config"
	"bgs/internal/gita"
	"bgs/internal/settings"
)

// ─────────────────────────────────────────────────────────────────────────────
// Resend API
// ─────────────────────────────────────────────────────────────────────────────

type resendPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

// SendEmail delivers a single transactional email via Resend.
// Returns nil on success (2xx), an error otherwise.
func SendEmail(to, subject, html string) error {
	if config.ResendAPIKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}

	fromEmail := settings.GetResendFromEmail()
	if fromEmail == "" {
		fromEmail = "shlok@ekashlok.com"
	}

	payload := resendPayload{
		From:    fmt.Sprintf("Ekashlok <%s>", fromEmail),
		To:      []string{to},
		Subject: subject,
		HTML:    html,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("email marshal: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("email request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.ResendAPIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("email send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend error %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// HMAC Unsubscribe Token
// ─────────────────────────────────────────────────────────────────────────────

// GenerateUnsubscribeToken creates a URL-safe base64-encoded HMAC-SHA256 token
// for the given email, signed with JWT_SECRET.
func GenerateUnsubscribeToken(email string) string {
	mac := hmac.New(sha256.New, []byte(config.JWTSecret))
	mac.Write([]byte("unsubscribe:" + email))
	return base64.URLEncoding.EncodeToString(mac.Sum(nil))
}

// VerifyUnsubscribeToken returns true if the token is a valid HMAC for email.
func VerifyUnsubscribeToken(email, token string) bool {
	expected := GenerateUnsubscribeToken(email)
	return hmac.Equal([]byte(expected), []byte(token))
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Email Template
// ─────────────────────────────────────────────────────────────────────────────

// BuildShlokEmailHTML renders a responsive, premium HTML email for a Gita verse.
// When isWeekly is true, the footer includes an unsubscribe link for weekly broadcasts.
// When isWeekly is false (login milestone emails), the footer is transactional and
// contains NO unsubscribe link, since users cannot unsubscribe from login emails.
func BuildShlokEmailHTML(v *gita.Verse, recipientEmail, title, subtitle string, isWeekly bool) string {
	websiteURL := config.FrontendURL

	badgeText := "WEEKLY WISDOM · हर हफ़्ते एक श्लोक"
	if !isWeekly {
		badgeText = "LOGIN MILESTONE · हर लॉगइन एक श्लोक"
	} else if strings.TrimSpace(subtitle) != "" {
		lowerSub := strings.ToLower(subtitle)
		lowerTitle := strings.ToLower(title)
		if strings.Contains(lowerSub, "weekly") || strings.Contains(lowerTitle, "weekly") {
			badgeText = "WEEKLY WISDOM · हर हफ़्ते एक श्लोक"
		} else if len(subtitle) <= 45 {
			badgeText = strings.ToUpper(subtitle)
		}
	}

	headerTitle := "Ekashlok · Bhagavad Gita"

	subText := "700 Verses · Ancient Wisdom for Modern Living"
	if strings.TrimSpace(subtitle) != "" {
		if !isWeekly || len(subtitle) > 45 {
			subText = subtitle
		}
	}

	chapterSubtitle := ""
	if strings.TrimSpace(v.ChapterName) != "" && strings.TrimSpace(v.ChapterNameHindi) != "" {
		chapterSubtitle = fmt.Sprintf(`<p style="margin:4px 0 0;font-size:12.5px;color:#9A6B4B;font-weight:500;">%s (%s)</p>`, escHTML(v.ChapterName), escHTML(v.ChapterNameHindi))
	} else if strings.TrimSpace(v.ChapterName) != "" {
		chapterSubtitle = fmt.Sprintf(`<p style="margin:4px 0 0;font-size:12.5px;color:#9A6B4B;font-weight:500;">%s</p>`, escHTML(v.ChapterName))
	} else if strings.TrimSpace(v.ChapterNameHindi) != "" {
		chapterSubtitle = fmt.Sprintf(`<p style="margin:4px 0 0;font-size:12.5px;color:#9A6B4B;font-weight:500;">%s</p>`, escHTML(v.ChapterNameHindi))
	}

	// English meaning block (only if present)
	englishBlock := ""
	if strings.TrimSpace(v.EnglishMeaning) != "" {
		englishBlock = fmt.Sprintf(`
              <!-- English Meaning -->
              <div style="margin-bottom:18px;">
                <div style="margin-bottom:6px;font-size:11px;font-weight:800;color:#FF6B00;text-transform:uppercase;letter-spacing:0.06em;">
                  📖 ENGLISH MEANING
                </div>
                <p style="margin:0;font-size:14px;color:#1A0800;line-height:1.65;">%s</p>
              </div>`, escHTML(v.EnglishMeaning))
	}

	// Simple explanation block (only if present)
	simpleBlock := ""
	if strings.TrimSpace(v.SimpleExplanation) != "" {
		simpleBlock = fmt.Sprintf(`
              <!-- Simple Explanation -->
              <div style="margin-bottom:18px;">
                <div style="margin-bottom:6px;font-size:11px;font-weight:800;color:#FF6B00;text-transform:uppercase;letter-spacing:0.06em;">
                  ✨ SIMPLE EXPLANATION
                </div>
                <p style="margin:0;font-size:13.5px;color:#6B3A1A;line-height:1.65;white-space:pre-line;">%s</p>
              </div>`, escHTML(v.SimpleExplanation))
	}

	// Life lesson block (only if present)
	lifeLessonBlock := ""
	if strings.TrimSpace(v.LifeLesson) != "" {
		lifeLessonBlock = fmt.Sprintf(`
              <!-- Life Lesson -->
              <div style="margin-bottom:6px;">
                <div style="margin-bottom:6px;font-size:11px;font-weight:800;color:#FF6B00;text-transform:uppercase;letter-spacing:0.06em;">
                  📚 LIFE LESSON
                </div>
                <div style="background:#FFF8F0;border:1px solid rgba(255,107,0,0.18);border-radius:12px;padding:14px 16px;">
                  <p style="margin:0;font-size:13.5px;color:#1A0800;line-height:1.65;font-style:italic;">%s</p>
                </div>
              </div>`, escHTML(v.LifeLesson))
	}

	footerContent := ""
	if isWeekly {
		unsubToken := GenerateUnsubscribeToken(recipientEmail)
		unsubURL := fmt.Sprintf("%s/unsubscribe?email=%s&token=%s",
			config.FrontendURL,
			urlEncode(recipientEmail),
			urlEncode(unsubToken),
		)
		footerContent = fmt.Sprintf(`<div>You received this email because you are subscribed to weekly Shloks on Ekashlok.com.</div>
              <div style="margin-top:6px;">
                <a href="%s" target="_blank" style="color:#E55A00;font-weight:600;text-decoration:underline;">
                  Unsubscribe from weekly email shloks
                </a>
              </div>`, unsubURL)
	} else {
		footerContent = `<div>You received this milestone update because you logged in to Ekashlok.com.</div>
              <div style="margin-top:4px;color:#A06C3E;font-size:10.5px;">
                Every login unlocks your next Bhagavad Gita shlok · 700 verses journey 🙏
              </div>`
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>%s | Ekashlok</title>
</head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F5F0EB;padding:28px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%%;background:#FFF8F0;border-radius:20px;
                      border:1px solid rgba(255,107,0,0.22);box-shadow:0 12px 40px rgba(255,107,0,0.12);
                      overflow:hidden;">

          <!-- Hero Header (Signature Bhagwa Saffron Gradient) -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF6B00 0%%,#FF8500 45%%,#FFA033 100%%);
                       padding:28px 24px 22px;text-align:center;color:#FFFFFF;">
              <div style="display:inline-block;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.38);
                          border-radius:99px;padding:4px 14px;font-size:11px;font-weight:700;color:#FFFFFF;
                          letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">
                🌼 %s
              </div>
              <h1 style="margin:0;font-size:24px;font-weight:900;color:#FFFFFF;letter-spacing:-0.01em;">
                🕉️ %s
              </h1>
              <p style="margin:6px 0 0;font-size:12.5px;color:rgba(255,255,255,0.92);font-weight:500;">
                %s
              </p>
            </td>
          </tr>

          <!-- Email Body / Today's Shlok Card Content -->
          <tr>
            <td style="padding:20px 18px;">
              <table width="100%%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#FFFFFF;border-radius:16px;border:1px solid rgba(255,107,0,0.2);
                            box-shadow:0 4px 20px rgba(255,107,0,0.06);overflow:hidden;">
                <tr>
                  <td style="padding:22px 20px;">
                    
                    <!-- Card Top Header -->
                    <table width="100%%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:18px;">
                      <tr>
                        <td valign="top" style="text-align:left;">
                          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#FF6B00;font-weight:700;margin-bottom:4px;">
                            🌼 Bhagavad Gita
                          </div>
                          <h2 style="font-size:19px;font-weight:800;color:#1A0800;margin:0;letter-spacing:-0.01em;">
                            Adhyay %d, Shlok %d
                          </h2>
                          %s
                        </td>
                        <td valign="top" align="right" style="text-align:right;">
                          <span style="display:inline-block;background:rgba(255,107,0,0.1);border:1px solid rgba(255,107,0,0.25);
                                       color:#FF6B00;font-size:11.5px;font-weight:700;padding:4px 12px;border-radius:99px;white-space:nowrap;">
                            Verse #%d of 700
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Sanskrit Section (Exact ShlokCard Box) -->
                    <div style="margin-bottom:18px;">
                      <div style="margin-bottom:6px;font-size:11px;font-weight:800;color:#FF6B00;text-transform:uppercase;letter-spacing:0.06em;">
                        🕉️ SANSKRIT
                      </div>
                      <div style="background-color:#FFF9F2;padding:14px 16px;border-radius:10px;
                                  border-left:3.5px solid #FF6B00;border-top:1px solid rgba(255,107,0,0.1);
                                  border-right:1px solid rgba(255,107,0,0.1);border-bottom:1px solid rgba(255,107,0,0.1);">
                        <p style="font-family:'Noto Serif Devanagari',Georgia,serif;font-size:18px;color:#1A0800;
                                  line-height:1.85;margin:0;white-space:pre-line;font-weight:600;">
                          %s
                        </p>
                      </div>
                    </div>

                    <!-- Transliteration Section -->
                    <div style="margin-bottom:18px;">
                      <div style="margin-bottom:5px;font-size:11px;font-weight:800;color:#FF6B00;text-transform:uppercase;letter-spacing:0.06em;">
                        🔤 TRANSLITERATION
                      </div>
                      <p style="font-size:13.5px;color:#6B3A1A;font-style:italic;line-height:1.65;margin:0;">
                        %s
                      </p>
                    </div>

                    <!-- Hinglish Meaning Section -->
                    <div style="margin-bottom:18px;">
                      <div style="margin-bottom:5px;font-size:11px;font-weight:800;color:#FF6B00;text-transform:uppercase;letter-spacing:0.06em;">
                        🪷 HINGLISH MEANING
                      </div>
                      <p style="font-size:14px;color:#1A0800;line-height:1.65;margin:0;">
                        %s
                      </p>
                    </div>

                    %s
                    %s
                    %s

                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align:center;margin:24px 0 10px;">
                <a href="%s" target="_blank"
                   style="display:inline-block;background:linear-gradient(135deg,#FF6B00 0%%,#E55A00 100%%);
                          color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:99px;
                          font-weight:800;font-size:14px;box-shadow:0 4px 16px rgba(255,107,0,0.32);
                          letter-spacing:0.01em;">
                  🕉️ Read on Ekashlok.com →
                </a>
                <div style="font-size:11.5px;color:#9A6B4B;margin-top:8px;">
                  Build your reading streak · Track daily shloks · Explore 700 verses
                </div>
              </div>

            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td style="background:#FFF0DC;padding:18px 20px;border-top:1px solid rgba(255,107,0,0.15);
                       text-align:center;font-size:11px;color:#8A5528;line-height:1.6;">
              %s
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
		escHTML(headerTitle),
		escHTML(badgeText),
		escHTML(headerTitle),
		escHTML(subText),
		v.ChapterNumber, v.VerseNumber,
		chapterSubtitle,
		v.VerseNumber,
		escHTML(v.Sanskrit),
		escHTML(v.Transliteration),
		escHTML(v.HinglishMeaning),
		englishBlock,
		simpleBlock,
		lifeLessonBlock,
		websiteURL,
		footerContent,
	)
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Milestone Alert
// ─────────────────────────────────────────────────────────────────────────────

// SendMilestoneAlertToAdmin fires an alert email to the admin when a user
// completes their 700th login journey (logged_count == 700).
func SendMilestoneAlertToAdmin(userName, userEmail string) {
	adminEmail := settings.GetAdminNotificationEmail()
	if adminEmail == "" || config.ResendAPIKey == "" {
		return
	}
	subject := fmt.Sprintf("🎉 User %s completed 700 Shlok logins!", userName)
	html := fmt.Sprintf(`<p>Congratulations! User <strong>%s</strong> (%s) has just completed their <strong>700th login milestone</strong> on Ekashlok.</p><p>They have read all 700 Bhagavad Gita Shloks. 🙏</p>`,
		escHTML(userName), escHTML(userEmail))
	if err := SendEmail(adminEmail, subject, html); err != nil {
		log.Printf("[EMAIL] Admin milestone alert failed: %v", err)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Milestone Email (goroutine-safe, fire-and-forget)
// ─────────────────────────────────────────────────────────────────────────────

// SendLoginMilestoneEmail asynchronously sends the milestone shlok email to a user.
// It is called from auth.go inside a goroutine so the auth response stays fast.
func SendLoginMilestoneEmail(userEmail, userName string, loggedCount int) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[EMAIL] Panic in login milestone email: %v", r)
			}
		}()

		v := gita.GetByShlokCount(loggedCount)
		if v == nil {
			log.Printf("[EMAIL] Login milestone: no verse for count %d", loggedCount)
			return
		}

		title := fmt.Sprintf("Shlok #%d — Your Login Milestone 🎯", loggedCount)
		subtitle := fmt.Sprintf("Namaste %s! Here is your login milestone shlok.", firstName(userName))
		html := BuildShlokEmailHTML(v, userEmail, title, subtitle, false)

		subject := fmt.Sprintf("🕉️ Your Shlok #%d/%d — Login Milestone | Ekashlok", loggedCount, gita.TotalVerses())
		if err := SendEmail(userEmail, subject, html); err != nil {
			log.Printf("[EMAIL] Login milestone send failed for %s: %v", userEmail, err)
		} else {
			log.Printf("[EMAIL] Login milestone email sent to %s (shlok #%d)", userEmail, loggedCount)
		}

		// Alert admin when user completes 700
		if loggedCount == gita.TotalVerses() {
			SendMilestoneAlertToAdmin(userName, userEmail)
		}

		// Trigger at every 100 milestones too (optional celebration)
		if loggedCount%100 == 0 && loggedCount != gita.TotalVerses() {
			log.Printf("[EMAIL] 🎯 User %s hit login milestone #%d!", userEmail, loggedCount)
		}
	}()
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

func escHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	// Preserve line breaks
	s = strings.ReplaceAll(s, "\n", "<br>")
	return s
}

func urlEncode(s string) string {
	var buf strings.Builder
	for _, b := range []byte(s) {
		switch {
		case b >= 'A' && b <= 'Z', b >= 'a' && b <= 'z', b >= '0' && b <= '9',
			b == '-', b == '_', b == '.', b == '~':
			buf.WriteByte(b)
		default:
			fmt.Fprintf(&buf, "%%%02X", b)
		}
	}
	return buf.String()
}

func firstName(name string) string {
	parts := strings.Fields(name)
	if len(parts) > 0 {
		return parts[0]
	}
	return name
}

// compile-time assertion: keep time import used
var _ = time.Now
