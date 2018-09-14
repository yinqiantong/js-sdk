import {
    getUrlParam,
    delUrlParam,
    isWechat,
    isAlipay,
    isAndroid,
    isIos,
    createWxAuthRedirectUrl
} from "./utils";

const $ = require('jquery');
let YQT_WX_PAY_CONFIG;

const showAlipayH5 = formBody => {
    const element = document.createElement('div');
    element.innerHTML = formBody;
    document.body.appendChild(element);
    document.forms['alipaysubmit'].submit()
};

const onBridgeReady = () => {
    WeixinJSBridge.invoke(
        'getBrandWCPayRequest', YQT_WX_PAY_CONFIG,
        res => {
            console.log(res);
            if (res.err_msg === "get_brand_wcpay_request:ok") {
            } else {
            }
        });
};

const createPayOrder = (url, type, data, channel, platform, code, error) => {
    if (!type) {
        type = 'POST'
    }
    $.ajax({
        url,
        type,
        data: {channel, platform, code, data},
        success: res => {
            if (res.code !== 200) {
                return error && error(res.msg)
            }
            pay(res.data)
        },
        error: () => {
            return error && error(res.msg)
        }
    });
};

const multipleQrCode = options => {
    let {url, type, data, wxAppId, code, showQrCode, showH5PaySelector, error} = options;
    if (showQrCode) {
        showQrCode(delUrlParam(location.href, 'code'))
    }

    if (isAlipay()) {
        return createPayOrder(url, type, data, "alipay", 'h5', 0, error)
    }

    if (isWechat()) {
        if (!code) {
            code = getUrlParam('code')
        }
        if (!code || code === '') {
            const currHref = location.href;
            location.href = createWxAuthRedirectUrl(wxAppId, currHref);
            return
        }
        return createPayOrder(url, type, data, 'wx', 'mp', code, error)
    }

    if (isAndroid() || isIos()) {
        if (!showH5PaySelector) {
            return error && error('selector not found')
        }
        return showH5PaySelector()
    }
};

const pay = options => {
    const {channel, /*out_trade_no,*/ platform, pay_body} = options;
    if (channel === "alipay") {
        switch (platform) {
            case 'h5':
            case 'pc':
                showAlipayH5(pay_body);
                return
        }
    } else if (channel === 'wx') {
        switch (platform) {
            case 'h5':
                location.href = pay_body;
                return;
            case 'mp':
                YQT_WX_PAY_CONFIG = JSON.parse(pay_body);
                if (typeof WeixinJSBridge === "undefined") {
                    if (document.addEventListener) {
                        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false)
                    } else if (document.attachEvent) {
                        document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                        document.attachEvent('onWeixinJSBridgeReady', onBridgeReady)
                    }
                } else {
                    onBridgeReady()
                }
                return
        }
    }

    console.error(`Unsupported ${channel} ${platform} ${pay_body}`);
};

const alipayH5 = options => {
    const {url, type, data, error} = options;
    createPayOrder(url, type, data, "alipay", 'h5', 0, error)
};

const alipayPc = options => {
    const {url, type, data, error} = options;
    createPayOrder(url, type, data, "alipay", 'pc', 0, error)
};

const wxpayH5 = options => {
    const {url, type, data, error} = options;
    createPayOrder(url, type, data, 'wx', 'h5', 0, error)
};

const wxpayMp = options => {
    const {url, type, data, code, error} = options;
    createPayOrder(url, type, data, 'wx', 'mp', code, error)
};

const test = options => {
    alert(options)
};

export {
    test,
    pay,
    multipleQrCode,
    alipayH5,
    alipayPc,
    wxpayH5,
    wxpayMp
}