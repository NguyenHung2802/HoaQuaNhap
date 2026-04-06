const fs = require('fs');

try {
    let content = fs.readFileSync('./prisma/schema.prisma', 'utf8');
    
    // Tìm vị trí model ContactMessage bị lỗi hoặc bất kỳ "m o d e l"
    // Clean text by stripping out any zero-width characters and spaces between letters
    let cleanIndex = content.indexOf('model PromotionProduct');
    
    if (cleanIndex !== -1) {
        // Keep everything up to PromotionProduct including its body
        let endOfPromotionProduct = content.indexOf('}', cleanIndex) + 1;
        content = content.substring(0, endOfPromotionProduct);
        
        // Add new ContactMessage model
        content += `\n\nmodel ContactMessage {\n  id         Int      @id @default(autoincrement())\n  name       String\n  phone      String\n  email      String?\n  content    String   @db.Text\n  is_read    Boolean  @default(false)\n  created_at DateTime @default(now())\n}\n`;
        
        fs.writeFileSync('./prisma/schema.prisma', content);
        console.log("Successfully fixed schema.");
    } else {
        console.log("Could not find PromotionProduct.");
    }
} catch(e) {
    console.error(e);
}
