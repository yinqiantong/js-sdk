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

const showAlipayH5 = formBody => {
    const element = document.createElement('div');
    element.innerHTML = formBody;
    document.body.appendChild(element);
    document.forms['alipaysubmit'].submit()
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

const getOrder = (url, outTradeNo, type, success, error) => {
    if (!type) {
        type = 'POST'
    }
    $.ajax({
        url,
        type,
        data: {out_trade_no: outTradeNo},
        success: res => {
            if (res.code !== 200) {
                return error && error(res.msg)
            }
            success(res.data)
        },
        error: () => {
            return error && error(res.msg)
        }
    })
};

const isPaySuccess = (order) => {
    return order && order.status && order.status === 'pay_success'
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
    const {channel, out_trade_no, platform, pay_body} = options;

    function onBridgeReady() {
        WeixinJSBridge.invoke(
            'getBrandWCPayRequest', JSON.parse(pay_body),
            function (res) {
                if (res.err_msg === "get_brand_wcpay_request:ok") {
                } else {
                }
            });
    }

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

const test = () => {
    alert('欢迎使用银钱通');
    console.log('欢迎使用银钱通')
};

export {
    test,
    pay,
    isPaySuccess,

    multipleQrCode,
    alipayH5,
    alipayPc,
    wxpayH5,
    wxpayMp,
}