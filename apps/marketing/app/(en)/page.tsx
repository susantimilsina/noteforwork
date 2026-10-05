import { homeMetadata } from '../../lib/meta';
import { HomeView } from '../../views/home';

export const metadata = homeMetadata('en');

export default function Home() {
  return <HomeView lang="en" />;
}
