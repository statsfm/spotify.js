# spotify.js

A API wrapper for Spotify, written in Typescript.

## Features

- Automatic token refreshing

## Usage

```bash
yarn add @spotistats/spotify.js
```

```ts
import { SpotifyAPI } from '@spotistats/spotify.js';

const api = new SpotifyAPI({
  clientId,
  clientSecret,
  refreshToken,
});

(async () => {
  try {
    const tracks = await api.tracks.list([
      '2cc8Sw1OnCuA5bV8nqWqpE',
      '4a8pP5X2lxwU5aprY44jLn',
      '5lIFsEWj9IjNEALbHnPosE',
      '4S4RWAA749dKyJQ5CiKEBJ',
      '4ZtFanR9U6ndgddUvNcjcG'
    ]);

    tracks.forEach((v) => {
      console.log(`${v.name} - ${v.artists[0].name}`);
    });
  } catch (err) {
    console.log(err);
  }
})();
```

## Maintainers

- [@stingalleman](https://github.com/stingalleman)
