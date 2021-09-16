# spotify.js

[![CI](https://github.com/spotistatsapp/spotify.js/actions/workflows/lint.yml/badge.svg)](https://github.com/spotistatsapp/spotify.js/actions/workflows/lint.yml)

An API wrapper for Spotify, written in Typescript. [Documentation](https://spotistatsapp.github.io/spotify.js/).

## Features

- Automatic token refreshing

## Usage

```bash
# using yarn
yarn add @spotistats/spotify.js
# or with npm
npm install @spotistats/spotify.js
```

```ts
import { SpotifyAPI } from '@spotistats/spotify.js';

const api = new SpotifyAPI({
  clientCredentials: {
    clientId: '',
    clientSecret: '',
  },
  refreshToken: '',
});

const tracks = await api.tracks
  .list([
    '2cc8Sw1OnCuA5bV8nqWqpE',
    '4a8pP5X2lxwU5aprY44jLn',
    '5lIFsEWj9IjNEALbHnPosE',
    '4S4RWAA749dKyJQ5CiKEBJ',
    '4ZtFanR9U6ndgddUvNcjcG',
  ])
  .then((tracks) => {
    tracks.forEach((track) => {
      console.log(`${track.name} - ${track.artists[0].name}`);
    });
  })
  .catch(console.error);
```

## Maintainers

- [@stingalleman](https://github.com/stingalleman)
