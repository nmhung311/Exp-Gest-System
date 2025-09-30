# Email Template Copy

## Subject Line
```
{{delivery.email_subject}}
```

## Preheader Text
```
Xác nhận trước {{rsvp.deadline}} để giữ chỗ.
```

## Email Body Template

### Hero Section
```
[Logo: {{branding.logo_url}}]

{{event.title}}
{{event.subtitle}}

Tổ chức bởi: {{event.host_org}}
```

### Greeting & Invitation
```
Kính gửi {{guest.title}} {{guest.name}},

Trân trọng kính mời Quý khách tham dự sự kiện đặc biệt:

📅 Thời gian: {{event.datetime}} ({{event.timezone}})
📍 Địa điểm: {{event.venue.name}}
🏢 Địa chỉ: {{event.venue.address}}
```

### Program Outline (nếu có)
```
Chương trình:
{{#each event.program_outline}}
• {{time}} - {{item}}
{{/each}}
```

### CTA Section
```
[Tham dự] [Từ chối]

⚠️ Vui lòng phản hồi trước {{rsvp.deadline}} để chúng tôi chuẩn bị tốt nhất.
```

### QR Ticket Section
```
🎫 VÉ THAM DỰ CỦA BẠN

[QR Code: {{qr.qr_url}}]

⚠️ QUAN TRỌNG: 
- Mỗi QR code chỉ sử dụng được 1 lần
- Không chia sẻ QR code này với người khác
- Mang theo QR code khi đến sự kiện để check-in
```

### Footer
```
---
{{event.host_org}}
📧 Liên hệ: info@exp.com
🌐 Website: www.exp.com

Nếu bạn không thể tham dự, vui lòng từ chối để chúng tôi có thể mời khách khác.
```

## Email Variables Reference

### Required Variables
- `{{delivery.email_subject}}` - Tiêu đề email
- `{{guest.title}}` - Danh xưng (Mr, Ms, Dr...)
- `{{guest.name}}` - Họ tên khách mời
- `{{event.title}}` - Tên sự kiện
- `{{event.subtitle}}` - Phụ đề sự kiện
- `{{event.host_org}}` - Tổ chức chủ trì
- `{{event.datetime}}` - Thời gian sự kiện
- `{{event.timezone}}` - Múi giờ
- `{{event.venue.name}}` - Tên địa điểm
- `{{event.venue.address}}` - Địa chỉ chi tiết
- `{{rsvp.deadline}}` - Hạn phản hồi
- `{{qr.qr_url}}` - URL ảnh QR code
- `{{branding.logo_url}}` - URL logo

### Optional Variables
- `{{event.program_outline}}` - Chương trình sự kiện
- `{{event.venue.map_url}}` - Link bản đồ
- `{{guest.role}}` - Chức vụ khách mời
- `{{guest.organization}}` - Tổ chức của khách mời

## Branding Guidelines

### Colors
- Primary: `{{branding.primary_color}}` (default: #0B2A4A)
- Accent: `{{branding.accent_color}}` (default: #1E88E5)
- Text: #333333
- Background: #FFFFFF

### Typography
- Font family: Arial, sans-serif (fallback)
- Headers: Bold, 18-24px
- Body: Regular, 14-16px
- CTA buttons: Bold, 16px

### Layout
- Max width: 600px
- Padding: 20px
- CTA buttons: 200px width, 40px height
- QR code: 150x150px
