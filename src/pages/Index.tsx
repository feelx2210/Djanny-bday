import { DjannyTokFeed } from '@/components/DjannyTokFeed';
import { DjannyTokHeader } from '@/components/DjannyTokHeader';

const Index = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <DjannyTokHeader />
      <DjannyTokFeed />
    </div>
  );
};

export default Index;
