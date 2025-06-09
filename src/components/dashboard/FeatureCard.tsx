import Image from 'next/image';
import Link from 'next/link';
interface FeatureCardProps {
  title: string;
  icon: string;
  href: string;
  color: 'blue' | 'red' | 'green' | 'purple';
}

export default function FeatureCard({ title, icon, href, color }: FeatureCardProps) {
  const colorMap = {
    blue: 'border-blue-200',
    red: 'border-red-200',
    green: 'border-green-200',
    purple: 'border-purple-200',
  };

  return (
    <div className="flex flex-col">
      <Link href={href}>
        <div className={`${colorMap[color]} bg-white overflow-hidden`}>
          <Image 
            src={icon} 
            alt={title} 
            width={160} 
            height={120} 
            className="w-full h-full object-contain" 
          />
        </div>
      </Link>
      <h2 className="text-center text-black mt-2" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '20px' }}>{title}</h2>
    </div>
  );
}