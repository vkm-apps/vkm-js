export default function (Alpine) {
    Alpine.directive('money', (el, { modifiers, expression }) => {
        let locale = 'en';
        let currency = 'EUR';
        let decimals = undefined;

        (modifiers || []).forEach(modifier => {
            if (/^\d+$/.test(modifier)) {
                decimals = modifier;
            } else if (/^[a-zA-Z]{3}$/.test(modifier)) {
                currency = modifier.toUpperCase();
            } else {
                locale = modifier;
            }
        });

        const currencyOverrides = {
            // Your original overrides
            ZAR: 'R',
            TRY: '₺',
            HRK: 'kn',
            DKK: 'kr',
            BGN: 'лв',
            AED: 'د.إ',

            // Extended list for Russia, Ukraine, Japan, Australia & Asia
            RUB: '₽',
            UAH: '₴',
            JPY: '¥',
            AUD: 'A$',
            CNY: '¥',
            INR: '₹',
            IDR: 'Rp',
            MYR: 'RM',
            PHP: '₱',
            SGD: 'S$',
            KRW: '₩',
            TWD: 'NT$',
            THB: '฿',
            VND: '₫',
            BDT: '৳',
            PKR: 'Rs',
            LKR: 'Rs',
            NPR: 'Rs',
            MMK: 'K',
            KZT: '₸',
            UZS: 'so’m',
            MNT: '₮',
            KHR: '៛',
            LAK: '₭',
            MOP: 'MOP$',
            MVR: '.ރ',
            BTN: 'Nu.',
            BND: 'B$',
            TLS: 'US$',
            YER: '﷼',
        };

        // Parse the amount inside the element
        const rawAmount = el.textContent.trim();
        const amount = parseFloat(rawAmount);
        const decimalsInt = parseInt(decimals);

        // Setup Intl.NumberFormat options
        const formatterOptions = {
            style: 'currency',
            currency,
            currencyDisplay: expression || 'symbol',
        };

        // If decimals modifier is valid number, force that decimal digits count
        if (!isNaN(decimalsInt)) {
            formatterOptions.minimumFractionDigits = decimalsInt;
            formatterOptions.maximumFractionDigits = decimalsInt;
        }

        const formatter = new Intl.NumberFormat(locale, formatterOptions);

        let formatted;

        if (!isNaN(amount)) {
            let displayAmount = amount;

            // If decimals provided, round to decimals
            if (!isNaN(decimalsInt)) {
                displayAmount = parseFloat(amount.toFixed(decimalsInt));
            }

            formatted = formatter.format(displayAmount);
        } else {
            // If amount is invalid, just show the currency symbol
            const currencyPart = formatter.formatToParts(0).find(p => p.type === 'currency');
            formatted = currencyPart ? currencyPart.value : '';
        }

        // Replace currency code with overrides if found
        if (currencyOverrides[currency]) {
            formatted = formatted.replace(currency, currencyOverrides[currency]);
        }

        el.textContent = formatted;
    });
}
