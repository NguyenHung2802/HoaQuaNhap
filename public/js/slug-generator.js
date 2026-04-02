/**
 * Slugify Vietnamese text for client-side
 * @param {string} text 
 * @returns {string}
 */
function slugifyVietnamese(text) {
    if (!text) return '';
    
    let slug = text.toLowerCase();

    // Map diacritics to non-diacritics
    const mapping = {
        'a': 'á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ',
        'e': 'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ',
        'i': 'í|ì|ỉ|ĩ|ị',
        'o': 'ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ',
        'u': 'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự',
        'y': 'ý|ỳ|ỷ|ỹ|ỵ',
        'd': 'đ'
    };

    for (let replacement in mapping) {
        let pattern = new RegExp(mapping[replacement], 'gi');
        slug = slug.replace(pattern, replacement);
    }

    // Replace special chars and whitespaces
    slug = slug.replace(/[^\w\s-]/gi, '')   // Delete non-word, non-space, non-dash
               .trim()
               .replace(/\s+/gi, '-')        // Replace spaces with dash
               .replace(/-+/gi, '-');        // Collapse multiple dashes
    
    return slug;
}
