# spotify.js

[![CI](https://github.com/backtrackapp/spotify.js/actions/workflows/lint.yml/badge.svg)](https://github.com/backtrackapp/spotify.js/actions/workflows/lint.yml)

An API wrapper for Spotify, written in Typescript. Made for [Spotistats for Spotify](https://spotistats.app/).

[Documentation](https://spotify.js.org/).

## Features

- Support for both the authorization code flow and the client credentials flow.
- Automatic token refreshing.
- Retries requests when the ratelimit is hit.
- Highly configurable.

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
  accessToken: '', // optional, required for private user data
  refreshToken: '', // optional, required for private user data and automatic token refreshing
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
