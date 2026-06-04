// Package gita provides in-memory access to all 700 Bhagavad Gita verses.
// The JSON data is embedded at compile time — no file system access needed at runtime.
package gita

import (
	_ "embed"
	"encoding/json"
	"log"
)

//go:embed bhagwat_gita.json
var gitaJSON []byte

// Chapter holds one chapter's metadata and all its verses.
type Chapter struct {
	ChapterNumber   int     `json:"chapterNumber"`
	ChapterName     string  `json:"chapterName"`
	ChapterNameHindi string `json:"chapterNameHindi"`
	Summary         string  `json:"summary"`
	VerseCount      int     `json:"verseCount"`
	Verses          []Verse `json:"verses"`
}

// Verse holds the full data for a single shlok.
type Verse struct {
	ChapterNumber    int    `json:"chapterNumber"`    // populated after load
	ChapterName      string `json:"chapterName"`      // populated after load
	ChapterNameHindi string `json:"chapterNameHindi"` // populated after load
	VerseNumber      int    `json:"verseNumber"`
	Sanskrit         string `json:"sanskrit"`
	Transliteration  string `json:"transliteration"`
	HinglishMeaning  string `json:"hinglishMeaning"`
	SimpleExplanation string `json:"simpleExplanation"`
	LifeLesson       string `json:"lifeLesson"`
	GlobalCount      int    `json:"global_count"` // 1–700
}

// ChapterSummary is a lightweight chapter descriptor for the browse page.
type ChapterSummary struct {
	ChapterNumber    int    `json:"chapter_number"`
	ChapterName      string `json:"chapter_name"`
	ChapterNameHindi string `json:"chapter_name_hindi"`
	Summary          string `json:"summary"`
	VerseCount       int    `json:"verse_count"`
}

var (
	chapters     []Chapter
	// flatVerses is a 1-indexed slice where flatVerses[0] is shlok #1 globally
	flatVerses   []Verse
	// chapterIndex maps chapterNumber → Chapter for O(1) lookup
	chapterIndex map[int]*Chapter
)

// Load parses the embedded JSON and builds internal indexes.
// Must be called once at application startup before any other gita function.
func Load() {
	var raw []Chapter
	if err := json.Unmarshal(gitaJSON, &raw); err != nil {
		log.Fatalf("[GITA] Failed to parse bhagwat_gita.json: %v", err)
	}

	chapters = raw
	chapterIndex = make(map[int]*Chapter, len(chapters))
	globalCount := 1

	for i := range chapters {
		ch := &chapters[i]
		chapterIndex[ch.ChapterNumber] = ch

		for j := range ch.Verses {
			v := &ch.Verses[j]
			v.ChapterNumber = ch.ChapterNumber
			v.ChapterName = ch.ChapterName
			v.ChapterNameHindi = ch.ChapterNameHindi
			v.GlobalCount = globalCount
			flatVerses = append(flatVerses, *v)
			globalCount++
		}
	}

	log.Printf("[GITA] Loaded %d chapters, %d verses total\n", len(chapters), len(flatVerses))
}

// TotalVerses returns the total number of shloks (700).
func TotalVerses() int {
	return len(flatVerses)
}

// GetByShlokCount returns the verse at the given 1-based global count (1–700).
// Returns nil if out of range.
func GetByShlokCount(count int) *Verse {
	if count < 1 || count > len(flatVerses) {
		return nil
	}
	v := flatVerses[count-1]
	return &v
}

// GetByChapterVerse returns the verse at the given chapter and verse number.
// Returns nil if not found.
func GetByChapterVerse(chapterNum, verseNum int) *Verse {
	ch, ok := chapterIndex[chapterNum]
	if !ok {
		return nil
	}
	for i := range ch.Verses {
		if ch.Verses[i].VerseNumber == verseNum {
			v := ch.Verses[i]
			return &v
		}
	}
	return nil
}

// GetChapterList returns all chapter summaries (no verse bodies).
func GetChapterList() []ChapterSummary {
	summaries := make([]ChapterSummary, 0, len(chapters))
	for _, ch := range chapters {
		summaries = append(summaries, ChapterSummary{
			ChapterNumber:    ch.ChapterNumber,
			ChapterName:      ch.ChapterName,
			ChapterNameHindi: ch.ChapterNameHindi,
			Summary:          ch.Summary,
			VerseCount:       ch.VerseCount,
		})
	}
	return summaries
}

// GetChapterVerses returns all verses in a given chapter (without body of other chapters).
// Returns nil if chapter not found.
func GetChapterVerses(chapterNum int) []Verse {
	ch, ok := chapterIndex[chapterNum]
	if !ok {
		return nil
	}
	verses := make([]Verse, len(ch.Verses))
	copy(verses, ch.Verses)
	return verses
}

// ShlokCountToChapterVerse converts a global count (1–700) to (chapter, verse).
func ShlokCountToChapterVerse(count int) (chapter, verse int) {
	v := GetByShlokCount(count)
	if v == nil {
		return 0, 0
	}
	return v.ChapterNumber, v.VerseNumber
}

// AdvanceCount returns the next shlok count, wrapping 700 → 1.
func AdvanceCount(current int) int {
	if current >= TotalVerses() {
		return 1
	}
	return current + 1
}
