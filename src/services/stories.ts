import * as Instagram from 'instagram-private-api';
import { login } from './auth';
import fs from 'node:fs';
import inquirer from 'inquirer';

type Viewer = {
  id: number;
  name: string;
  username: string;
  isFollower: boolean;
};

export async function getStoriesViewers(ig: Instagram.IgApiClient) {
  const auth = await login(ig);

  if (!auth) {
    throw new Error('❌ A autenticação falhou.');
  }

  const reelsFeed = ig.feed.reelsMedia({
    userIds: [auth.pk],
  });

  const stories = await reelsFeed.items();

  if (!stories.length) {
    console.log('❌ Você não possui stories.');
    return;
  }

  const { storyNumber } = await inquirer.prompt([
    {
      type: 'number',
      name: 'storyNumber',
      message: 'Digite o número do story que deseja obter informações:',
    },
  ]);

  const selectedStory = stories[storyNumber - 1];

  if (!selectedStory) {
    console.log('❌ O story selecionado não existe.');
    return;
  }

  const viewers: Viewer[] = [];

  let isMoreAvailable = true;

  const story = ig.feed.listReelMediaViewers(stories[storyNumber - 1].pk);

  while (isMoreAvailable) {
    const items = await story.items();

    const itemsMap: Viewer[] = items.map((item) => ({
      id: item.pk,
      name: item.full_name,
      username: item.username,
      isFollower: !!item.friendship_status?.following,
    }));

    viewers.push(...itemsMap);

    isMoreAvailable = story.isMoreAvailable();
  }

  const response = {
    count: viewers.length,
    viewers,
  };

  const fileName = `data/viewers-${selectedStory.pk}.json`;

  const writeStream = fs.createWriteStream(fileName);

  writeStream.write(JSON.stringify(response, null, 2));

  writeStream.end();

  console.log(`✅ Os dados foram salvos em ${fileName}.`);
}
