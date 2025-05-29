import { ConfigProvider } from 'antd';
import React, { useState } from 'react';
import Generator from './pages/Generator';
import Home from './pages/Home';
import Recovery from './pages/Recovery';

type Page = 'home' | 'generator' | 'recovery';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'generator':
        return <Generator onNavigate={handleNavigate} />;
      case 'recovery':
        return <Recovery onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            itemColor: '#151515',
            itemActiveColor: '#52C791',
            itemHoverColor: '#52C791',
            itemSelectedColor: '#52C791',
            inkBarColor: '#52C791',
            colorBorderSecondary: '#fff',
          },
          Button: {
            primaryColor: '#fff',

            defaultBg: '#52C791',
            defaultColor: '#fff',
            defaultBorderColor: '#52C791',

            defaultHoverBg: '#52C791',
            defaultHoverColor: '#fff',
            defaultHoverBorderColor: '#52C791',

            defaultActiveBg: '#52C791',
            defaultActiveColor: '#fff',
            defaultActiveBorderColor: '#52C791',

            controlHeight: 48,
          },
          Input: {
            controlHeight: 48,
            colorBgContainer: '#F9F9F9',
            colorBorder: '#fff',
            hoverBorderColor: '#52C791',
            activeBorderColor: '#52C791',
          },
          Upload: {
            colorFillAlter: '#fff',
          },
          Form: {
            itemMarginBottom: 0,
          },
          Card: {
            bodyPadding: 20,
          },
        },
      }}
    >
      {renderPage()}
    </ConfigProvider>
  );
};

export default App;
