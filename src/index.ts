import { client } from './client';
import { getStoriesViewers } from './services/stories';

(async () => {
  await getStoriesViewers(client);
})();
