package services

import (
	"strings"
	"testing"
	"time"

	"bgs/internal/config"
	"bgs/internal/gita"
)

func TestUnsubscribeToken(t *testing.T) {
	config.JWTSecret = "test-secret-key-12345"
	email := "bhakt@ekashlok.com"

	token := GenerateUnsubscribeToken(email)
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	if !VerifyUnsubscribeToken(email, token) {
		t.Fatal("expected token to verify successfully")
	}

	if VerifyUnsubscribeToken("other@ekashlok.com", token) {
		t.Fatal("expected token verification to fail for different email")
	}

	if VerifyUnsubscribeToken(email, token+"tampered") {
		t.Fatal("expected tampered token verification to fail")
	}
}

func TestBuildShlokEmailHTML(t *testing.T) {
	config.JWTSecret = "test-secret-key-12345"
	config.FrontendURL = "https://ekashlok.com"

	verse := &gita.Verse{
		ChapterNumber:     2,
		VerseNumber:       47,
		ChapterName:       "Sankhya Yoga",
		ChapterNameHindi:  "सांख्य योग",
		Sanskrit:          "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
		Transliteration:   "karmaṇy-evādhikāras te mā phaleṣu kadācana",
		HinglishMeaning:   "Aapko kewal karm karne ka adhikar hai, fal ka nahi.",
		EnglishMeaning:    "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.",
		SimpleExplanation: "Focus on the process, not the outcome.",
		LifeLesson:        "Duty without attachment leads to peace.",
	}

	// 1. Weekly email (must have unsubscribe link)
	htmlWeekly := BuildShlokEmailHTML(verse, "user@example.com", "Today's Shlok", "Weekly Wisdom", true)

	if !strings.Contains(htmlWeekly, "कर्मण्येवाधिकारस्ते") {
		t.Error("expected Sanskrit verse in HTML")
	}
	if !strings.Contains(htmlWeekly, "Aapko kewal karm") {
		t.Error("expected Hinglish meaning in HTML")
	}
	if !strings.Contains(htmlWeekly, "prescribed duty") {
		t.Error("expected English meaning in HTML")
	}
	if !strings.Contains(htmlWeekly, "unsubscribe?email=user%40example.com") {
		t.Error("expected encoded unsubscribe URL in weekly HTML")
	}
	if !strings.Contains(htmlWeekly, "Unsubscribe from weekly email shloks") {
		t.Error("expected unsubscribe text in weekly HTML")
	}

	// 2. Login milestone email (must NOT have any unsubscribe link)
	htmlMilestone := BuildShlokEmailHTML(verse, "user@example.com", "Shlok #1 — Your Login Milestone 🎯", "Namaste! Here is your milestone shlok.", false)
	if strings.Contains(strings.ToLower(htmlMilestone), "unsubscribe") {
		t.Error("milestone email should NOT contain unsubscribe link or text")
	}
	if !strings.Contains(htmlMilestone, "You received this milestone update because you logged in to Ekashlok.com.") {
		t.Error("expected milestone transactional footer in HTML")
	}
}

func TestNextRunCalculation(t *testing.T) {
	h, m := parseHHMM("0600", 9, 0)
	if h != 6 || m != 0 {
		t.Fatalf("expected 06:00, got %02d:%02d", h, m)
	}

	h, m = parseHHMM("2354", 9, 0)
	if h != 23 || m != 54 {
		t.Fatalf("expected 23:54, got %02d:%02d", h, m)
	}

	if parseWeekday("monday") != time.Monday {
		t.Fatalf("expected Monday")
	}
	if parseWeekday("friday") != time.Friday {
		t.Fatalf("expected Friday")
	}

	config.EmailShlokDay = "monday"
	config.EmailShlokTime = "0600"
	next := nextEmailSendTimeIST()
	if next.Weekday() != time.Monday {
		t.Fatalf("expected next run on Monday, got %v", next.Weekday())
	}
	if next.Hour() != 6 || next.Minute() != 0 {
		t.Fatalf("expected 06:00, got %02d:%02d", next.Hour(), next.Minute())
	}
}
