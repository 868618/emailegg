# emailegg

send mass email without setting up smtp server

emialegg is a module for Node.js applications to email sending


## Usage

Install with npm

    npm install emailegg

Require in your scripts

```javascript
var emailegg = require('emailegg')({ silent: true });
```
If you want to specify a local IP u can require like this

```javascript
var emailegg = require('emailegg')({ silent: true, localAddress: 8.8.8.8 });
```

## Methods

You can send mail like this :

```javascript
sendmail({
    from: 'test@yourdomain.com',
    to: 'kenny@yourdomain.com',
    replyTo: 'jason@yourdomain.com',
    subject: 'MailComposer sendmail',
    html: 'Mail of test sendmail '
}, (errInfo, succInfo) => {
    if(err) {
        console.log(errInfo)
        return
    }
    console.log(succInfo)
})
```



### succInfo
```javascript
Success: SMTP code:221, from:test@yourdomain.com, to:kenny@baidu.com, domain:baidu.com, msg:221 2.0.0 Bye, mx:mx.baidu.com
```

### errInfo
```javascript
Error: SMTP code:550, from:test@yourdomain.com, to:kennys@baidu.com, domain:baidu.com, msg:550 5.1.1 <kennys@baidu.com>: Recipient address rejected: User unknown in local recipient table
```



## License

**MIT**
