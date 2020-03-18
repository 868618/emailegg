const dns = require('dns')
const net = require('net')
const ip = require('ip')
const MailComposer = require("nodemailer/lib/mail-composer")
const { DKIMSign } = require('dkim-signer');
class Main{
    constructor(options) {
        this.options = options
        this.localAddress = (options && options.localAddress) || ip.address()
        this.step = 0
    }
    async makeMessage(options){
        return new Promise((resolve, reject) => {
            const mail = new MailComposer(options).compile()
            mail.build((err, msg) => {
                err ? reject(err): resolve(msg)
            })
        })
    }
    makeSign (message, domainName) {
        const { dkimPrivateKey, dkimKeySelector } = this.options.dkim
        const signature = DKIMSign(message, {
            privateKey: dkimPrivateKey,
            keySelector: dkimKeySelector,
            domainName
        });
        return signature + '\r\n' + message
    }
    checkMx(domain) {
        return new Promise((resolve, reject) => {
            dns.resolve(domain, 'MX', (err, info) => {
                err ? reject(err): resolve(info)
            })
        })
    }
    getDomain(email) {
        const m = /[^@]+@([\w\d\-\.]+)/.exec(email);
        return m && m[1];
    }
    async sendEmail(options, cb) {
        const localAddress = this.localAddress
        const {from ,to} = options
        const fromDomain = this.getDomain(from)
        const { dkimPrivateKey, dkimKeySelector } = (this.options && this.options.dkim) || {}
        const mail = await this.makeMessage(options)
        // 如果dkim配置存在的话， 就给message加密
        const message = (dkimPrivateKey && dkimKeySelector) ? this.makeSign(mail, fromDomain) : mail
        const helo = fromDomain
        const toDomain = this.getDomain(to)
        const statusInfo = {
            status: '',
            code: 0,
            mx: null,
            reason: ''
        }
        // 拿到mx地址集
        let mxList
        try {
            mxList = await this.checkMx(toDomain)
            // console.log('mxList', mxList)
        } catch (err) {
            // console.log('err', err)
            Object.assign(statusInfo,{status: 'fail', from, to, domain: helo, mx: null, reason: err.code} )
            // cb(`status: fail, code: ${0}, from: ${from}, to: ${to}, domain: ${helo}, mx: ${null}, reason: ${err.code}`)
            cb(statusInfo)
            return
        }
        // 排序并取出第一只
        const [{exchange: host}] = mxList.sort((a, b) => a.priority > b.priority)
        // console.log('host', host)
        const sock = net.connect({
            localAddress,
            host,
            port: 25
        })
        // 格式为 utf8
        sock.setEncoding('utf8');
        // 连接成功事件
        sock.on('connect', () => {
            // console.log('连接就绪')
        })
        // 接收数据监听
        sock.on('data', chunk => {
            // console.log('data', chunk)
            const code = Number(chunk.toString().substring(0,3))
            // console.log('code', code)
            switch (code) {
                case 220:
                    if (this.step == 0) {
                        sock.write(`HELO ${helo} \r\n`, () => {
                            this.step = 1
                        })
                        break
                    }

                case 221:
                    sock.write(`QUITE`, () => {
                        this.step = 6
                        Object.assign(statusInfo,{status: 'success', from, to, domain: helo, mx: host, reason: chunk} )
                        cb(null, statusInfo)
                        // cb(null, `status: success, code: ${code}, from: ${from}, to: ${to}, domain: ${helo}, mx: ${host}, reason: ${chunk}`)
                        sock.end();
                    })
                    break

                case 250:
                    if (this.step == 1) {
                        sock.write(`MAIL FROM: <${from}> \r\n`, () => {
                            this.step = 2
                        })
                        break
                    }

                    if (this.step == 2) {
                        sock.write(`RCPT TO: <${to}> \r\n`, () => {
                            this.step = 3
                        })
                        break
                    }
                    if (this.step == 3) {
                        sock.write(`data \r\n`, () => {
                            this.step = 4
                        })
                        break
                    }
                case 354:
                    if (this.step == 4) {
                        sock.write(`${message.toString()} \r\n`, () => {
                            sock.write('.' + '\r\n')
                        })
                        break
                    }
                default:
                    if (code >= 400) {
                        Object.assign(statusInfo,{status: 'fail', from, to, domain: helo, mx: host, reason: chunk} )
                        cb(statusInfo)
                        // cb(`status: fail, code: ${code}, from: ${from}, to: ${to}, domain: ${helo}, mx: ${host}, reason: ${chunk}`)
                        sock.end();
                        // sock.destory()
                        break
                    }

            }
        })

        sock.on('error', err => {
            // return cb(new Error('sock on error'))
            // cb(err)
            sock.destroy();
        })
    }
}

module.exports = Main
