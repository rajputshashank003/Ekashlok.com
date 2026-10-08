package gita

import (
	"testing"
)

func TestLoad(t *testing.T) {
	Load()

	if len(chapters) != 18 {
		t.Fatalf("expected 18 chapters, got %d", len(chapters))
	}

	if TotalVerses() != 700 {
		t.Fatalf("expected 700 verses, got %d", TotalVerses())
	}

	// Verify Chapter 9
	ch9Verses := GetChapterVerses(9)
	if len(ch9Verses) != 34 {
		t.Fatalf("expected 34 verses in chapter 9, got %d", len(ch9Verses))
	}
	for i, v := range ch9Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch9 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch9 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch9 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch9 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch9 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 10
	ch10Verses := GetChapterVerses(10)
	if len(ch10Verses) != 42 {
		t.Fatalf("expected 42 verses in chapter 10, got %d", len(ch10Verses))
	}
	for i, v := range ch10Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch10 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch10 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch10 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch10 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch10 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 11
	ch11Verses := GetChapterVerses(11)
	if len(ch11Verses) != 55 {
		t.Fatalf("expected 55 verses in chapter 11, got %d", len(ch11Verses))
	}
	for i, v := range ch11Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch11 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch11 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch11 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch11 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch11 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 12
	ch12Verses := GetChapterVerses(12)
	if len(ch12Verses) != 20 {
		t.Fatalf("expected 20 verses in chapter 12, got %d", len(ch12Verses))
	}
	for i, v := range ch12Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch12 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch12 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch12 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch12 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch12 verse %d missing LifeLesson", v.VerseNumber)
		}
	}
}
