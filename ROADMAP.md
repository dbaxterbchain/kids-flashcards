# Roadmap

Ideas for making Kids Flashcards more fun and more effective for kids from age 2 up, and easier for the grown-ups who set it up. Each idea has a short sketch of how it could work. Nothing here is committed to a date.

## Recently done
- **Set library:** 53 ready-made sets, from farm animals and feelings to fractions, sight words, Spanish, French and binary. Parents add a set in one tap.
- **Share and import sets:** send any set as one file, with its pictures, recordings, colors and languages.
- **Read-aloud language per card,** so Spanish words are read by a Spanish voice.
- **Themed and photo avatars** for each child.
- **Automated tests and CI:** unit tests, phone and desktop browser tests, run on every pull request.

## More effective

### Learn before quiz
Young kids learn better when they aren't quizzed on something they've never seen.
- A card a child hasn't met yet is first introduced: shown big, flipped and read aloud.
- It comes back later in the same round as an easy question with only two choices.
- Each round mixes in one or two new cards at most, so rounds stay mostly familiar.
- Each child's progress would record when a card was introduced.

### Progress for grown-ups
Show grown-ups how each child is doing, set by set.
- **Mastered:** answered right over several days, so reviews are a week or more apart.
- **Learning:** seen, but not yet solid.
- **Tricky:** missed more than once recently. These are good cards to talk about together.
- **Not started.**

The spaced-repetition data behind this is already saved for each child.

### Auto-adjusting difficulty
- Track each child's recent answers (say, the last 20).
- If they're getting nearly everything right, add an answer choice or switch on mixed questions.
- If they're struggling, take a choice away.
- Tell the grown-ups when this happens, and let them switch it off.

### Talk-about-it prompts
- An optional question on the back of a card, like "What sound does a dog make?" or "Where do we see Grandma?"
- Talking about a card builds more vocabulary than naming it.
- Library sets could come with prompts, and parents could write their own in the card editor.
- Prompts would be saved in backups and shared set files.

## More fun

### Stickers and streaks
- Each child earns a sticker for every finished round and collects them in their own sticker book.
- A gentle streak ("3 days in a row!") that never scolds a missed day.

### New games
- **Memory match:** flip two cards at a time to find the pairs. Toddlers match picture to picture; readers match picture to word.
- **Listen and find:** sound only, with no written word on screen, for real pre-readers. A big speaker button replays the word.
- **Odd one out:** three or four pictures, one from a different set ("Which one isn't a fruit?"). This works especially well with library sets.

### "Say it" mode
- The child taps the microphone and says the word.
- The app plays their voice back next to the grown-up's recording (or the device's voice).
- No speech recognition or grading; the point is practice and giggles.
- The child's recordings aren't kept unless a grown-up chooses to keep them.

## Practical

### Print a set
- Print any set as real two-sided flashcards.
- Fronts go on one page and backs on the next, mirrored so they line up when printed double-sided, with cut lines.
- Uses the browser's print dialog, which can also save a PDF.

### Open shared sets straight from Messages or email
- Let the installed app open set files directly, instead of saving them first and choosing Import a set.
- This would use the share target on Android and file handling on computers.

## More library sets
Ideas that didn't make the first batch:
- Letter sounds (phonics).
- Rhyming words.
- Life cycles (egg, caterpillar, chrysalis, butterfly).
- Parts of a plant.
- The human body.
- Days, months and seasons.
- Continents and flags. These would need to be drawn, since flag emoji don't show on Windows.
