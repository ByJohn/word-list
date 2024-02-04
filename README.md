# Word List

A client-side web app to generate lists of common words, ordered in a way that is reproducibly-random.

The randomisation is based on a user-provided seed (shuffle code), making the word order deterministic - The same seed will produce the same output word order.

## Demo

Hosted on GitHub Pages here: [words.johnevans.uk](https://words.johnevans.uk/)

## Raw Word Lists

The raw words are in CSV files, grouped by word class (eg. noun, verb, adjective), within language directories, within the ```words``` directory.

Within each CSV file, the words are ordered alphabetically and use three columns:

| Word | Type | Tags |
| --- | --- | --- |
|The word in title case. | The class type (eg. nouns could be "Concrete", "Abstract" or "Proper"). | Common categories that the word belongs to (eg. "Location", "Food" or "Sport"). Multiple tags are separated by a pipe ( \| ) character .

## Tabletop Game Use

The original purpose of this web app was to supplement tabletop games that need shareable, preset lists of words, for example:

- Pictionary
- Just One
- Codenames
- Decrypto
- Banned Words

## Testing (CSV Validation)

There are automated tests to validate the csv files.

To install the test dependencies, run the following command:
```
$ npm install
```

To run the tests, run the following command:
```
$ npm run test
```


## To Do
- Add more words.
- Add details to all words.
- Allow words to be filtered by type and tag.