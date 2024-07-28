describe('HttpManager', () => {
  describe('auth', () => {
    it('should use access token when it is active', async () => {});

    it('should refresh access token before request when it is expired', async () => {});

    it('should request new access token when refresh token is not specified', async () => {});

    it('should throw error when unable to issue access token', async () => {});
  });

  describe('retries', () => {});

  describe('rate limit', () => {});

  describe('errors', () => {});

  describe('methods', () => {
    it('should return 200 in case of success', () => {});
  });
});
