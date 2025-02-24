import { scryptAsync } from '@noble/hashes/scrypt';
import argon2 from 'argon2-browser';
import Crypto from 'crypto';

const { createCipheriv, createDecipheriv, randomBytes } = Crypto;

/**
 * 用于封装外部加密数据的接口
 */
export interface EncryptedData {
  ciphertext: string; // 加密内容
  salt: string; // 盐值
  iv: string; // 初始化向量
  tag: string; // GCM 认证标签
  type?: string; // WALLETMNEMONIC
  version?: string; // APP 版本
}

/**
 * 使用类来统一管理加密和解密逻辑
 */
export class KeyVaultCrypto {
  // 加密算法常量
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly HASH_LENGTH = 32;

  // Argon2 配置
  private readonly ARGON2_OPTIONS = {
    iterations: 3, // 迭代次数
    memory: 2 ** 16, // 内存成本
    parallelism: 4, // 并行度
    hashLength: this.HASH_LENGTH,
    mode: 'argon2id', // Argon2 模式
  };

  // Scrypt 配置
  private readonly SCRYPT_OPTIONS = {
    N: 2 ** 16, // CPU/内存成本参数
    r: 8, // 块大小
    p: 4, // 并行度
    maxmem: 128 * 1024 * 1024, // 128MB
  };

  constructor(private password: string, public appVersion?: string) {}

  /**
   * 使用 Argon2 和 Scrypt 生成最终用于 AES-256-GCM 的密钥
   * @param salt - 盐值（hex 或 utf8，取决于实际需要）
   * @returns 生成的密钥 Buffer
   */
  public async generateKey(password: string, salt: string): Promise<Buffer> {
    // 1. Argon2 先生成中间密钥
    const { hashHex: argon2Key } = await argon2.hash({
      pass: password,
      salt, // react-native-argon2 需要 UTF-8 编码的 salt
      time: this.ARGON2_OPTIONS.iterations,
      mem: this.ARGON2_OPTIONS.memory,
      parallelism: this.ARGON2_OPTIONS.parallelism,
      hashLen: this.ARGON2_OPTIONS.hashLength,
      type: argon2.ArgonType.Argon2id,
    });

    // 2. 再通过 scrypt 算法利用 argon2Key + salt 生成最终密钥
    const scryptKey = await scryptAsync(
      Buffer.from(argon2Key, 'hex'),
      Buffer.from(salt, 'hex'), // 这里假设 salt 为 hex 格式
      this.SCRYPT_OPTIONS
    );

    return Buffer.from(scryptKey);
  }

  /**
   * 加密方法：给定明文和密码，返回包含加密结果的对象
   * @param plaintext - 需要加密的字符串
   * @returns EncryptedData 包含密文、salt、iv、tag
   */
  public async encryptMnemonic(plaintext: string, type = 'WALLETMNEMONIC'): Promise<EncryptedData> {
    // 1. 随机生成 salt（16字节）和 iv（12字节）
    const salt = randomBytes(16).toString('hex');
    const iv = randomBytes(12).toString('hex');

    // 2. 生成密钥
    const key = await this.generateKey(this.password, salt);

    // 3. 创建加密器并加密
    const cipher = createCipheriv(this.ENCRYPTION_ALGORITHM, key, Buffer.from(iv, 'hex'));

    const ciphertextPart = cipher.update(plaintext, 'utf8', 'hex');
    const finalCiphertextPart = cipher.final('hex');
    const ciphertext = ciphertextPart + finalCiphertextPart;

    // 4. 获取 GCM 认证标签
    const tag = cipher.getAuthTag().toString('hex');

    // 5. 返回加密结果
    return { ciphertext, salt, iv, tag, version: this.appVersion, type };
  }

  /**
   * 解密方法：给定密码和加密数据，返回解密后的字符串
   * @param password - 用户输入的明文密码
   * @param encryptedData - EncryptedData 包含密文、salt、iv、tag
   * @returns 解密后的明文字符串
   */
  public async decryptMnemonic(encryptedData: EncryptedData): Promise<string> {
    const { salt, iv, ciphertext, tag } = encryptedData;

    // 1. 生成密钥
    const key = await this.generateKey(this.password, salt);

    // 2. 创建解密器并解密
    const decipher = createDecipheriv(this.ENCRYPTION_ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decryptedText = decipher.update(ciphertext, 'hex', 'utf8');
    decryptedText += decipher.final('utf8');

    return decryptedText;
  }
}
