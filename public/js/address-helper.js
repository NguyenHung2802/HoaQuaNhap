/**
 * Address Helper for WebHoaQua
 * Handles Province, District, Ward selection using public API
 */
class AddressHelper {
    constructor(config) {
        this.apiUrl = 'https://provinces.open-api.vn/api';
        this.provinceSelect = document.querySelector(config.provinceSelector);
        this.districtSelect = document.querySelector(config.districtSelector);
        this.wardSelect = document.querySelector(config.wardSelector);
        this.onAddressChange = config.onAddressChange || (() => {});

        this.init();
    }

    async init() {
        if (!this.provinceSelect) return;

        // Load Provinces
        await this.loadProvinces();

        // Province Change
        this.provinceSelect.addEventListener('change', async () => {
            const provinceCode = this.provinceSelect.options[this.provinceSelect.selectedIndex].dataset.code;
            if (provinceCode) {
                await this.loadDistricts(provinceCode);
            } else {
                this.clearSelect(this.districtSelect, 'Chọn Quận/Huyện');
                this.clearSelect(this.wardSelect, 'Chọn Phường/Xã');
            }
            this.onAddressChange();
        });

        // District Change
        if (this.districtSelect) {
            this.districtSelect.addEventListener('change', async () => {
                const districtCode = this.districtSelect.options[this.districtSelect.selectedIndex].dataset.code;
                if (districtCode) {
                    await this.loadWards(districtCode);
                } else {
                    this.clearSelect(this.wardSelect, 'Chọn Phường/Xã');
                }
                this.onAddressChange();
            });
        }

        // Ward Change
        if (this.wardSelect) {
            this.wardSelect.addEventListener('change', () => {
                this.onAddressChange();
            });
        }
    }

    async loadProvinces() {
        try {
            const res = await fetch(`${this.apiUrl}/p/`);
            const data = await res.json();
            const currentValue = this.provinceSelect.dataset.selected;

            this.clearSelect(this.provinceSelect, 'Chọn Tỉnh/Thành phố');
            
            // Only Hà Nội is supported as per user request
            const supportedProvinces = data.filter(p => p.name.includes('Hà Nội') || p.code == 1);
            
            supportedProvinces.forEach(p => {
                const option = new Option(p.name, p.name);
                option.dataset.code = p.code;
                if (p.name === currentValue) option.selected = true;
                this.provinceSelect.add(option);
            });

            if (this.provinceSelect.value && this.provinceSelect.value !== '') {
                const code = this.provinceSelect.options[this.provinceSelect.selectedIndex].dataset.code;
                await this.loadDistricts(code);
            }
        } catch (e) { console.error('Error loading provinces', e); }
    }

    async loadDistricts(provinceCode) {
        if (!this.districtSelect) return;
        try {
            const res = await fetch(`${this.apiUrl}/p/${provinceCode}?depth=2`);
            const data = await res.json();
            const currentValue = this.districtSelect.dataset.selected;

            this.clearSelect(this.districtSelect, 'Chọn Quận/Huyện');
            data.districts.forEach(d => {
                const option = new Option(d.name, d.name);
                option.dataset.code = d.code;
                if (d.name === currentValue) option.selected = true;
                this.districtSelect.add(option);
            });

            if (this.districtSelect.value && this.districtSelect.value !== '') {
                const code = this.districtSelect.options[this.districtSelect.selectedIndex].dataset.code;
                await this.loadWards(code);
            }
        } catch (e) { console.error('Error loading districts', e); }
    }

    async loadWards(districtCode) {
        if (!this.wardSelect) return;
        try {
            const res = await fetch(`${this.apiUrl}/d/${districtCode}?depth=2`);
            const data = await res.json();
            const currentValue = this.wardSelect.dataset.selected;

            this.clearSelect(this.wardSelect, 'Chọn Phường/Xã');
            data.wards.forEach(w => {
                const option = new Option(w.name, w.name);
                option.dataset.code = w.code;
                if (w.name === currentValue) option.selected = true;
                this.wardSelect.add(option);
            });
        } catch (e) { console.error('Error loading wards', e); }
    }

    clearSelect(select, placeholder) {
        if (!select) return;
        select.innerHTML = `<option value="">-- ${placeholder} --</option>`;
    }
}
