"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

type MenuClientProps = {
  role: string;
  menuItems: Array<{
    title: string;
    items: Array<{
      icon: string;
      label: string;
      href: string;
      visible: string[];
    }>;
  }>;
};

const MenuClient = ({ role, menuItems }: MenuClientProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close menu when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menuElement = document.getElementById('sidebar');
      const hamburgerButton = document.getElementById('hamburger-button');
      
      if (isOpen && menuElement && !menuElement.contains(event.target as Node) && 
          hamburgerButton && !hamburgerButton.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  return (
    <>
      {/* Hamburger button - visible on mobile only */}
      <button
        id="hamburger-button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className={`w-full h-0.5 bg-gray-600 transform transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-full h-0.5 bg-gray-600 transition-all ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
          <span className={`w-full h-0.5 bg-gray-600 transform transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {/* Backdrop - visible on mobile when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`fixed lg:relative top-0 left-0 h-full bg-white z-40 w-64 lg:w-auto transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mt-16 lg:mt-4 text-sm px-4">
          {menuItems.map((i) => {
            // Check if any items in this section are visible to the current role
            const visibleItems = i.items.filter(item => item.visible.includes(role));
            
            // Only render the section if there are visible items
            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div className="flex flex-col gap-2" key={i.title}>
                <span className="text-gray-400 font-light my-4">
                  {i.title}
                </span>
                {i.items.map((item) => {
                  if (item.visible.includes(role)) {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        href={item.href}
                        key={item.label}
                        className={`flex items-center gap-4 text-gray-500 py-2 px-2 rounded-md hover:bg-lamaSkyLight transition-all ${
                          isActive ? "bg-lamaSkyLight border border-sky-500" : ""
                        }`}
                      >
                        <Image src={item.icon} alt="" width={20} height={20} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  }
                  return null;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MenuClient;
