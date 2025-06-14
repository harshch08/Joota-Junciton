import React from 'react';
import { Info, AlertCircle, Bell } from 'lucide-react';

const AnnouncementBar: React.FC = () => {
  const announcements = [
    { text: "₹200 Advance for Cash On Delivery", icon: <Info className="h-4 w-4 mr-2" /> },
    { text: "Our Team will contact you for order confirmation", icon: <AlertCircle className="h-4 w-4 mr-2" /> },
    { text: "New Collection Available", icon: <Bell className="h-4 w-4 mr-2" /> },
    { text: "₹200 Advance for Cash On Delivery", icon: <Info className="h-4 w-4 mr-2" /> },
    { text: "Our Team will contact you for order confirmation", icon: <AlertCircle className="h-4 w-4 mr-2" /> },
    { text: "New Collection Available", icon: <Bell className="h-4 w-4 mr-2" /> }
  ];

  return (
    <div className="bg-black text-white py-2 overflow-hidden">
      <div className="announcement-bar">
        <div className="announcement-content">
          {announcements.map((announcement, index) => (
            <div
              key={index}
              className="whitespace-nowrap px-6 flex-shrink-0 flex items-center"
            >
              {announcement.icon}
              {announcement.text}
            </div>
          ))}
        </div>
        <div className="announcement-content" aria-hidden="true">
          {announcements.map((announcement, index) => (
            <div
              key={`duplicate-${index}`}
              className="whitespace-nowrap px-6 flex-shrink-0 flex items-center"
            >
              {announcement.icon}
              {announcement.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar; 