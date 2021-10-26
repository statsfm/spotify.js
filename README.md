# spotify.js

[![CI](https://github.com/backtrackapp/spotify.js/actions/workflows/lint.yml/badge.svg)](https://github.com/backtrackapp/spotify.js/actions/workflows/lint.yml)

An API wrapper for Spotify, written in Typescript. Made for [Spotistats for Spotify](https://spotistats.app/).

[Documentation](https://spotify.js.org/).

## Features

- Automatic token refreshing
- Authentication
  - Client Credentials flow
  - Authorization Code flow (with `refreshToken`)

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
  accessToken: '',
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
