# spotify.js
Test
[![CI](https://github.com/statsfm/spotify.js/actions/workflows/lint.yml/badge.svg)](https://github.com/statsfm/spotify.js/actions/workflows/lint.yml)

An API wrapper for Spotify, written in Typescript. Made for [Stats.fm (formerly known as Spotistats for Spotify)](https://stats.fm/).

[Documentation](https://spotify.js.org/).

## Features

- Support for both the authorization code flow and the client credentials flow.
- Automatic token refreshing.
- Retries requests when the ratelimit is hit.
- Highly configurable.

## Usage

```bash
# using yarn
yarn add @statsfm/spotify.js
# or with npm
npm install @statsfm/spotify.js
```

```ts
import { SpotifyAPI } from '@statsfm/spotify.js';

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
