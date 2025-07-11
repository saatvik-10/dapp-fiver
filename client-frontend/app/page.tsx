import Appbar from '@/components/Appbar';
import { Hero } from '@/components/Hero';
import Upload from '@/components/Upload';

export default function Home() {
  return (
    <main className='bg-white min-h-screen'>
      <Appbar />
      <Hero />
      <Upload />
    </main>
  );
}
