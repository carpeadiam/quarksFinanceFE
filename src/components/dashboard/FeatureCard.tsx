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
    <div className="flex flex-col h-full">
      <Link href={href}>
        <div className={`${colorMap[color]} bg-white overflow-hidden rounded-lg p-2 flex items-center justify-center aspect-[4/3]`}>
          <Image 
            src={icon} 
            alt={title} 
            width={140} 
            height={105} 
            className="object-contain w-full h-full" 
          />
        </div>
      </Link>
      <h2 className="text-center text-black mt-2 px-1 text-sm md:text-base" style={{ fontFamily: 'Rubik, sans-serif' }}>{title}</h2>
    </div>
  );
}