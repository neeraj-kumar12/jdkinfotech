"use client";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

const baseTitle = "JDK Infotech";

const titleMap = {
  // Public routes
  "/": `Home | ${baseTitle}`,
  "/login": `Login | ${baseTitle}`,
  "/register": `Register | ${baseTitle}`,
  "/404": `Page Not Found | ${baseTitle}`,
  
  // Student dashboard
  "/student-dashboard": `Dashboard | ${baseTitle}`,
  "/student-dashboard/exams": `Exams | ${baseTitle}`,
  "/student-dashboard/results": `Results | ${baseTitle}`,
  "/student-dashboard/courses": `Courses | ${baseTitle}`,
  "/student-dashboard/fees": `Fees | ${baseTitle}`,
  "/student-dashboard/documents": `Documents | ${baseTitle}`,
  "/student-dashboard/profile": `Profile | ${baseTitle}`,
  "/student-dashboard/announcements": `Announcements | ${baseTitle}`,
  
  // Staff dashboard
  "/staff-dashboard": `Staff Dashboard | ${baseTitle}`,
  "/staff-dashboard/exams": `Exams (Staff) | ${baseTitle}`,
  "/staff-dashboard/results": `Results (Staff) | ${baseTitle}`,
  "/staff-dashboard/courses": `Courses (Staff) | ${baseTitle}`,
  "/staff-dashboard/fees": `Fees (Staff) | ${baseTitle}`,
  "/staff-dashboard/documents": `Documents (Staff) | ${baseTitle}`,
  "/staff-dashboard/profile": `Profile (Staff) | ${baseTitle}`,
  "/staff-dashboard/announcements": `Announcements (Staff) | ${baseTitle}`,
};

const validRoutes = {
  "/student-dashboard": ["exams", "results", "courses", "fees", "documents", "profile", "announcements"],
  "/staff-dashboard": ["exams", "results", "courses", "fees", "documents", "profile", "announcements"],
};

export default function DynamicTitle() {
  const pathname = usePathname();
  
  // Memoize the path analysis
  const { normalizedPath, isInvalidRoute } = useMemo(() => {
    if (!pathname) return { normalizedPath: "", isInvalidRoute: false };
    
    const normalizedPath = pathname.replace(/\/$/, ""); // Remove trailing slash
    const segments = normalizedPath.split('/').filter(Boolean);
    
    let isInvalid = false;
    
    // Check for invalid sub-routes
    if (segments.length >= 2) {
      const basePath = `/${segments[0]}`;
      const subRoute = segments[1];
      
      if (validRoutes[basePath] && !validRoutes[basePath].includes(subRoute)) {
        isInvalid = true;
      }
    }
    
    return { normalizedPath, isInvalidRoute: isInvalid };
  }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined' || !normalizedPath) return;

    // Set default title immediately
    document.title = baseTitle;

    const updateTitle = () => {
      // 1. Check for invalid routes first
      if (isInvalidRoute) {
        document.title = titleMap["/404"];
        return;
      }

      // 2. Check exact match
      if (titleMap[normalizedPath]) {
        document.title = titleMap[normalizedPath];
        return;
      }

      // 3. Find closest parent route
      const segments = normalizedPath.split('/').filter(Boolean);
      for (let i = segments.length; i > 0; i--) {
        const testPath = '/' + segments.slice(0, i).join('/');
        if (titleMap[testPath]) {
          document.title = titleMap[testPath];
          return;
        }
      }

      // 4. Final fallback
      document.title = segments.length > 0 ? titleMap["/404"] : titleMap["/"];
    };

    // Use microtask for batching
    Promise.resolve().then(updateTitle);
    
  }, [normalizedPath, isInvalidRoute]);

  return null;
}