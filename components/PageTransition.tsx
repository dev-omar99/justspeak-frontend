import { ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

// مكوّن بسيط بيلف محتوى أي صفحة بحركة دخول خفيفة (fade)
// flex-1 هنا مهم عشان المكوّن يتمدد ياخد المساحة المتبقية في الصفحة
// (بدل ما ياخد بس حجم المحتوى اللي جواه) عشان العناصر تفضل في النص صح
export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return <div className={`page-transition flex-1 flex flex-col ${className}`}>{children}</div>;
}