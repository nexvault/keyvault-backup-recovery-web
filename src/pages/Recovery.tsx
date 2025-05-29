import { decodeQR } from '@paulmillr/qr/decode.js';
import { Button, Card, Form, Input, message, Modal, Space, Tabs, TabsProps, Typography, Upload } from 'antd';
import { decode as readJPEG } from 'jpeg-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CameraIcon from '../assets/camera.png';
import UploadIcon from '../assets/upload.png';
import Layout from '../components/Layout';
import { KeyVaultCrypto } from '../lib/KeyVaultCrypto';

const CustomButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}> = ({ children, onClick, icon, ...props }) => (
  <Button
    style={{
      fontSize: '12px',
      backgroundColor: '#fff',
      color: '#151515',
      borderColor: '#CCD1DA',
      padding: 0,
      height: '24px',
      width: '96px',
    }}
    onClick={onClick}
    {...props}
  >
    {icon}
    {children}
  </Button>
);

const CustomCardStyle: any = {
  padding: 0,
  margin: 0,
  border: '1px dashed #8890a3',
  minWidth: '320px',
  textAlign: 'center',
  overflow: 'hidden',
};

interface RecoveryProps {
  onNavigate: (page: 'home' | 'generator' | 'recovery') => void;
}

const Recovery: React.FC<RecoveryProps> = ({ onNavigate }) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUploadChange = ({ fileList: newFileList }: any) => {
    for (const newFile of newFileList) {
      // 优化超长文件名展示，保留前 18 位和后 8 位
      if (newFile.name.length >= 20) newFile.name = `${newFile.name.slice(0, 18)}...${newFile.name.slice(-8)}`;
    }
    setFileList(newFileList);
  };

  const handleTabChange = (_key: string) => {
    setFileList([]);
    setImageData(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const blobToData = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (fileList.length === 0 && !imageData) {
      message.error('请上传图片文件或拍照');
      return;
    }
    if (!password) {
      message.error('请输入密码');
      return;
    }

    setLoading(true);

    try {
      // read fileData
      let fileDataUri: string;
      if (imageData) {
        fileDataUri = imageData;
      } else {
        const file = fileList[0].originFileObj;
        fileDataUri = await blobToData(file);
      }
      const fileData = fileDataUri.split(',')[1];
      // decodeQR
      const img = readJPEG(Buffer.from(fileData as string, 'base64'));
      const decoded = decodeQR(img);
      // parse JSON
      const qrData = JSON.parse(decoded);
      // decryptMnemonic
      const keyVaultCrypto = new KeyVaultCrypto(password, qrData.version);
      const decrypted = await keyVaultCrypto.decryptMnemonic(qrData);
      const result = JSON.stringify(JSON.parse(decrypted), null, 2);
      Modal.success({
        title: '解密成功',
        width: '850px',
        style: { maxWidth: '50vw' },
        content: (
          <Typography>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '50vh', overflow: 'auto' }}>{result}</pre>
          </Typography>
        ),
      });
    } catch (_error) {
      if (_error instanceof Error) {
        const errorMessages = {
          'len(found) = 0': '未检测到有效二维码',
          'Unexpected token': '图片内容无法解析',
          'Unsupported state or unable to authenticate data': '密码不正确',
          'SOI not found': '图片格式不正确',
        };

        const errorMsg = Object.entries(errorMessages).reduce(
          (message, [errorPattern, customMessage]) =>
            _error.toString().includes(errorPattern) ? customMessage : message,
          `未知错误: ${_error}`
        );
        Modal.error({ title: '解密失败', content: errorMsg });
      }
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      message.error(`无法访问摄像头: ${err}`);
      console.error(err);
    }
  };

  const stopCamera = useCallback(() => {
    console.log('Stopping camera');
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleCapture = useCallback(() => {
    console.log(`Capturing at ${new Date().toISOString()}`);
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // 设置 canvas 尺寸与视频一致
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        // 绘制当前视频帧到 canvas
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        // 获取 canvas 图像数据
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        // 判断是否有二维码
        try {
          const img = readJPEG(Buffer.from(dataUrl.split(',')[1], 'base64'));
          decodeQR(img); // 检测是否有二维码
          setImageData(dataUrl); // 保存截图
          message.success('已捕获二维码');
          stopCamera(); // 停止摄像头
        } catch (err: any) {
          if (err.toString().includes('len(found) = 0')) return; // 没有检测到二维码
          console.warn('handleCapture', err);
        }
      }
    }
  }, [videoRef, canvasRef, stopCamera]);

  const uploadTabPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Upload
        accept="image/*"
        action="/upload"
        listType="picture"
        fileList={fileList}
        onChange={handleUploadChange}
        beforeUpload={() => false} // 防止自动上传
        maxCount={1}
        showUploadList={true}
        previewFile={(file) => {
          return blobToData(file as Blob);
        }}
        style={{ cursor: 'pointer', width: '320px', overflow: 'hidden' }}
      >
        <Card style={CustomCardStyle}>
          <Space direction="vertical" align="center">
            <img src={UploadIcon} alt="Upload" style={{ width: '83px' }} />
            <CustomButton>点击上传图片</CustomButton>
          </Space>
        </Card>
      </Upload>
    </div>
  );

  const cameraTabPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Card style={CustomCardStyle}>
        <Space direction="vertical" align="center">
          {imageData ? (
            <>
              <img src={imageData} alt="Captured" width="100%" />
              <CustomButton
                onClick={() => {
                  setImageData(null); // 清除图片
                  startCamera(); // 再次启动摄像头
                }}
              >
                重新拍
              </CustomButton>
            </>
          ) : (
            <>
              <video ref={videoRef} width="100%" height="auto" style={{ display: stream ? 'block' : 'none' }} />
              {!stream && (
                <>
                  <img src={CameraIcon} alt="Camera" style={{ width: '83px' }} />
                  <CustomButton onClick={startCamera}>启动摄像头</CustomButton>
                </>
              )}
              {stream && <CustomButton onClick={stopCamera}>取消</CustomButton>}
            </>
          )}
        </Space>
      </Card>
    </div>
  );

  const items: TabsProps['items'] = [
    { key: 'upload', label: '上传图片', children: uploadTabPanel },
    { key: 'camera', label: '使用摄像头', children: cameraTabPanel },
  ];

  useEffect(() => {
    if (!stream) return;
    const interval = setInterval(() => {
      handleCapture();
    }, 1000);
    return () => clearInterval(interval);
  }, [handleCapture, stream]);

  return (
    <Layout>
      <Form layout="vertical" onFinish={handleSubmit}>
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
          <Tabs defaultActiveKey="upload" centered items={items} onChange={handleTabChange} />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
          style={{ marginTop: 48, marginBottom: 48 }}
        >
          <Input.Password value={password} onChange={handlePasswordChange} placeholder="请输入密码" allowClear />
        </Form.Item>

        <Form.Item>
          <Button type="default" htmlType="submit" loading={loading} block>
            提交
          </Button>
        </Form.Item>
      </Form>
    </Layout>
  );
};

export default Recovery;
