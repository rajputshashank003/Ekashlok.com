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

	// Verify Chapter 13
	ch13Verses := GetChapterVerses(13)
	if len(ch13Verses) != 34 {
		t.Fatalf("expected 34 verses in chapter 13, got %d", len(ch13Verses))
	}
	for i, v := range ch13Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch13 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch13 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch13 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch13 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch13 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 14
	ch14Verses := GetChapterVerses(14)
	if len(ch14Verses) != 27 {
		t.Fatalf("expected 27 verses in chapter 14, got %d", len(ch14Verses))
	}
	for i, v := range ch14Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch14 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch14 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch14 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch14 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch14 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 15
	ch15Verses := GetChapterVerses(15)
	if len(ch15Verses) != 20 {
		t.Fatalf("expected 20 verses in chapter 15, got %d", len(ch15Verses))
	}
	for i, v := range ch15Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch15 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch15 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch15 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch15 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch15 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 16
	ch16Verses := GetChapterVerses(16)
	if len(ch16Verses) != 24 {
		t.Fatalf("expected 24 verses in chapter 16, got %d", len(ch16Verses))
	}
	for i, v := range ch16Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch16 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch16 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch16 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch16 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch16 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 17
	ch17Verses := GetChapterVerses(17)
	if len(ch17Verses) != 28 {
		t.Fatalf("expected 28 verses in chapter 17, got %d", len(ch17Verses))
	}
	for i, v := range ch17Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch17 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch17 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch17 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch17 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch17 verse %d missing LifeLesson", v.VerseNumber)
		}
	}

	// Verify Chapter 18
	ch18Verses := GetChapterVerses(18)
	if len(ch18Verses) != 78 {
		t.Fatalf("expected 78 verses in chapter 18, got %d", len(ch18Verses))
	}
	for i, v := range ch18Verses {
		if v.VerseNumber != i+1 {
			t.Errorf("ch18 verse number mismatch: expected %d, got %d", i+1, v.VerseNumber)
		}
		if v.EnglishMeaning == "" {
			t.Errorf("ch18 verse %d missing EnglishMeaning", v.VerseNumber)
		}
		if v.HinglishMeaning == "" {
			t.Errorf("ch18 verse %d missing HinglishMeaning", v.VerseNumber)
		}
		if v.SimpleExplanation == "" {
			t.Errorf("ch18 verse %d missing SimpleExplanation", v.VerseNumber)
		}
		if v.LifeLesson == "" {
			t.Errorf("ch18 verse %d missing LifeLesson", v.VerseNumber)
		}
	}
}


