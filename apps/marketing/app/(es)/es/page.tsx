import { homeMetadata } from '../../../lib/meta';
import { HomeView } from '../../../views/home';

export const metadata = homeMetadata('es');

export default function Inicio() {
  return <HomeView lang="es" />;
}
