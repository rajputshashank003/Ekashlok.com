package services

import (
	"strings"
	"testing"

	"bgs/internal/gita"
)

func TestFormatShlokMessage(t *testing.T) {
	verseWithEnglish := &gita.Verse{
		ChapterNumber:     11,
		VerseNumber:       1,
		Sanskrit:          "मदनुग्रहाय परमं...",
		Transliteration:   "Madanugrahaya paramam...",
		HinglishMeaning:   "Arjun ne kaha...",
		EnglishMeaning:    "Arjuna said: By hearing the confidential spiritual matters...",
		SimpleExplanation: "Simple explanation...",
		LifeLesson:        "Life lesson...",
	}

	msgWith := FormatShlokMessage(verseWithEnglish)
	if !strings.Contains(msgWith, "📖 *English Meaning:*\nArjuna said: By hearing the confidential spiritual matters...") {
		t.Errorf("expected English Meaning section in message, got: %s", msgWith)
	}
	if !strings.Contains(msgWith, "🪷 *Hinglish Meaning:*\nArjun ne kaha...\n\n📖 *English Meaning:*") {
		t.Errorf("expected English Meaning to appear right after Hinglish Meaning, got: %s", msgWith)
	}

	verseWithoutEnglish := &gita.Verse{
		ChapterNumber:     1,
		VerseNumber:       1,
		Sanskrit:          "धर्मक्षेत्रे कुरुक्षेत्रे...",
		Transliteration:   "Dharmakshetre kurukshetre...",
		HinglishMeaning:   "Dhritarashtra ne kaha...",
		EnglishMeaning:    "",
		SimpleExplanation: "Simple explanation...",
		LifeLesson:        "Life lesson...",
	}

	msgWithout := FormatShlokMessage(verseWithoutEnglish)
	if strings.Contains(msgWithout, "English Meaning") {
		t.Errorf("did not expect English Meaning section in message, got: %s", msgWithout)
	}
	if !strings.Contains(msgWithout, "🪷 *Hinglish Meaning:*\nDhritarashtra ne kaha...\n\n✨ *Simple Explanation (Hinglish):*") {
		t.Errorf("expected clean transition between Hinglish and Simple Explanation when English Meaning is omitted, got: %s", msgWithout)
	}
}
