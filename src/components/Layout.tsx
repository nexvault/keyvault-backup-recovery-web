import { Card } from 'antd';
import React from 'react';
import HeaderBG from '../assets/header.png';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card
        style={{ width: 448, padding: 0, margin: 0, border: '1px solid #ddd', borderRadius: 12 }}
        cover={<img src={HeaderBG} alt="Header" />}
      >
        <div style={{ width: '320px', margin: '0 auto' }}>{children}</div>
      </Card>
    </div>
  );
};

export default Layout;
