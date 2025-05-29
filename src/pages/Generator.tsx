import { Button, Form, Input, message, Modal } from 'antd';
import QRCode from 'qrcode';
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { KeyVaultCrypto } from '../lib/KeyVaultCrypto';

const { TextArea } = Input;
const VERSION = '1.0.5';

interface GeneratorProps {
  onNavigate: (page: 'home' | 'generator' | 'recovery') => void;
}

const Generator: React.FC<GeneratorProps> = ({ onNavigate }) => {
  const [mnemonic, setMnemonic] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // 计算单词数量
  const wordCount = mnemonic.trim()
    ? mnemonic
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;

  // 检查是否可以生成（12或24个单词）
  const canGenerate = (wordCount === 12 || wordCount === 24) && password.trim().length > 0;

  const handleMnemonicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMnemonic(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      message.error('请输入12或24个助记词和密码');
      return;
    }

    setLoading(true);

    try {
      // 检查助记词单词是否合法
      const keyVaultCrypto = new KeyVaultCrypto(password, VERSION);
      const invalidWords = await keyVaultCrypto.checkMnemonicWords(mnemonic);
      if (invalidWords) {
        message.error(`助记词中包含无效单词: ${invalidWords}`);
        return;
      }
      // 检查完整的助记词是否合法
      const isValidMnemonic = await keyVaultCrypto.validateMnemonic(mnemonic);
      if (!isValidMnemonic) {
        message.error('助记词不合法');
        return;
      }
      // 包装助记词
      const data = JSON.stringify({
        plaintext: mnemonic,
        type: 'WALLETMNEMONIC',
      });
      // 使用 KeyVaultCrypto 加密
      const encryptedData = await keyVaultCrypto.encryptMnemonic(data);

      // 序列化为字符串
      const jsonString = JSON.stringify(encryptedData);

      // 生成二维码
      const qrOptions = {
        errorCorrectionLevel: 'M' as const,
        type: 'image/jpeg' as const,
        quality: 1,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 500,
      };

      const qrDataUrl = await QRCode.toDataURL(jsonString, qrOptions);
      setQrDataUrl(qrDataUrl);
      setIsModalVisible(true);

      message.success('二维码生成成功！');
    } catch (error) {
      console.error('生成失败:', error);
      message.error('生成失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `KeyVault_${new Date().toISOString().replace(/[:.]/g, '-')}.JPG`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('二维码已保存到本地');
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setQrDataUrl('');
  };

  return (
    <Layout>
      <Form layout="vertical" onFinish={handleGenerate}>
        <Form.Item>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Button
              type="text"
              onClick={() => onNavigate('home')}
              style={{
                padding: 0,
                height: 'auto',
                fontSize: '14px',
                color: '#52C791',
              }}
            >
              ← 返回
            </Button>
          </div>
        </Form.Item>

        <Form.Item
          label="助记词"
          name="mnemonic"
          rules={[
            { required: true, message: '请输入助记词' },
            {
              validator: (_, value) => {
                const words =
                  value
                    ?.trim()
                    .split(/\s+/)
                    .filter((word: string) => word.length > 0) || [];
                if (words.length !== 12 && words.length !== 24) {
                  return Promise.reject(new Error('助记词必须为12个或24个单词'));
                }
                return Promise.resolve();
              },
            },
          ]}
          style={{ marginBottom: 12 }}
        >
          <TextArea
            value={mnemonic}
            onChange={handleMnemonicChange}
            placeholder="请输入12个或24个助记词，用空格分隔"
            rows={4}
            style={{ resize: 'none' }}
          />
        </Form.Item>

        <div
          style={{
            textAlign: 'right',
            marginBottom: 24,
            fontSize: '12px',
            color: wordCount === 12 || wordCount === 24 ? '#52C791' : '#999',
          }}
        >
          当前单词数: {wordCount}
        </div>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
          style={{ marginBottom: 48 }}
        >
          <Input.Password value={password} onChange={handlePasswordChange} placeholder="请输入加密密码" allowClear />
        </Form.Item>

        <Form.Item>
          <Button type="default" htmlType="submit" loading={loading} disabled={!canGenerate} block>
            生成备份二维码
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="备份二维码"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="download" type="default" onClick={handleDownload}>
            保存到本地
          </Button>,
          <Button key="close" onClick={handleModalClose}>
            关闭
          </Button>,
        ]}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {qrDataUrl && <img src={qrDataUrl} alt="Backup QR Code" style={{ maxWidth: '100%', height: 'auto' }} />}
          <div style={{ marginTop: 16, fontSize: '14px', color: '#666' }}>请妥善保存此二维码，用于恢复您的助记词</div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Generator;
