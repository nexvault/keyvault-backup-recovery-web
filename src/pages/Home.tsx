import { Button, Space, Typography } from 'antd';
import React from 'react';
import Layout from '../components/Layout';

const { Title } = Typography;

interface HomeProps {
  onNavigate: (page: 'generator' | 'recovery') => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Title level={3} style={{ marginBottom: 48, color: '#151515' }}>
          选择操作
        </Title>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button type="default" size="large" block onClick={() => onNavigate('generator')} style={{ height: 48 }}>
            生成备份二维码
          </Button>
          <Button type="default" size="large" block onClick={() => onNavigate('recovery')} style={{ height: 48 }}>
            从备份二维码恢复
          </Button>
        </Space>
      </div>
    </Layout>
  );
};

export default Home;
