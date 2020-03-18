const Main = require('./index')
const moment = require('moment')
const fs = require('fs')
const path = require('path')
const csvdata = require('csvdata')


const main = new Main()
const checkIsHaveLogFile = () => {
    const fileName = `${moment().format('YYYY-MM-DD')}.csv`
    const pathName = path.resolve(__dirname, fileName)
    return new Promise((resolve, reject) => {
        fs.stat(pathName, (err, stats) => {
            if (err) {
                fs.appendFileSync(pathName, `status, code, from, to, domain, mx, reason \n`)
                resolve(fileName)
            } else {
                if (!stats.isFile()) {
                    fs.appendFileSync(pathName, `status, code, from, to, domain, mx, reason \n`)
                }
                resolve(fileName)
            }
        })
    })
}

main.sendEmail({
    // from: 'shanjiandeshu@163.com',
    from: 'baidu@baidu.com',
    to: 'shanjiandeshu@163.com',
    subject: '爱上我的仙人掌',
    text: '杀死一只白狐狸'
    // message:
}, async (err, info) => {
    const logFileName = await checkIsHaveLogFile()
    const result = err || info
    // const {status, code, from, to, domain, mx, reason} = result
    // fs.appendFileSync(logFileName, `"${status}", "${code}", "${from}", "${to}", "${domain}",  "${mx}",  "${reason}"\n`)
    Object.keys(result).map(item => {
        result[item] = `"${result[item]}"`
    })

    csvdata.write(logFileName, [result], {header: 'status,code,from,to,domain,mx,reason', append: true})
})

