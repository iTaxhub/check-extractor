import { sectionRoute } from '@/components/marketing/sectionRoute';

const route = sectionRoute('features');
export const dynamicParams = false;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
