#!/usr/bin/env node

// Script để tự động cập nhật tất cả API calls từ hardcode URLs sang sử dụng API utility
const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Tìm tất cả các file TypeScript/JavaScript trong thư mục app
const files = glob.sync('app/**/*.{ts,tsx,js,jsx}', { cwd: __dirname })

console.log(`🔍 Tìm thấy ${files.length} files để cập nhật...`)

// Mapping các API calls cũ sang mới
const apiMappings = [
  // Events
  {
    pattern: /fetch\("http:\/\/localhost:5001\/api\/events"\)/g,
    replacement: 'api.getEvents()',
    description: 'Events API'
  },
  {
    pattern: /fetch\("http:\/\/localhost:5001\/api\/events",\s*\{[^}]*\}\s*\)/g,
    replacement: (match) => {
      // Extract method and body from the match
      const methodMatch = match.match(/method:\s*["'](\w+)["']/)
      const bodyMatch = match.match(/body:\s*JSON\.stringify\(([^)]+)\)/)
      
      if (methodMatch && bodyMatch) {
        const method = methodMatch[1].toLowerCase()
        const body = bodyMatch[1]
        
        if (method === 'post') {
          return `api.createEvent(${body})`
        } else if (method === 'put') {
          return `api.updateEvent(id, ${body})`
        } else if (method === 'delete') {
          return `api.deleteEvent(id)`
        }
      }
      return match
    },
    description: 'Events API with options'
  },
  
  // Guests
  {
    pattern: /fetch\("http:\/\/localhost:5001\/api\/guests"\)/g,
    replacement: 'api.getGuests()',
    description: 'Guests API'
  },
  {
    pattern: /fetch\("http:\/\/localhost:5001\/api\/guests\?event_id=\$\{eventId\}"\)/g,
    replacement: 'api.getGuests(eventId)',
    description: 'Guests API with event filter'
  },
  {
    pattern: /fetch\("http:\/\/localhost:5001\/api\/guests\/checked-in"\)/g,
    replacement: 'api.getGuestsCheckedIn()',
    description: 'Checked-in guests API'
  },
  
  // Check-in
  {
    pattern: /fetch\("http:\/\/localhost:5001\/api\/checkin",\s*\{[^}]*\}\s*\)/g,
    replacement: (match) => {
      const methodMatch = match.match(/method:\s*["'](\w+)["']/)
      const bodyMatch = match.match(/body:\s*JSON\.stringify\(([^)]+)\)/)
      
      if (methodMatch && bodyMatch) {
        const method = methodMatch[1].toLowerCase()
        const body = bodyMatch[1]
        
        if (method === 'post') {
          return `api.checkinGuest(${body})`
        } else if (method === 'put') {
          return `api.checkoutGuest(${body})`
        }
      }
      return match
    },
    description: 'Check-in API'
  },
  
  // QR Code
  {
    pattern: /fetch\(`http:\/\/localhost:5001\/api\/guests\/\$\{guest\.id\}\/qr`\)/g,
    replacement: 'api.getGuestQR(guest.id)',
    description: 'Guest QR API'
  },
  {
    pattern: /fetch\(`http:\/\/localhost:5001\/api\/guests\/\$\{guestId\}\/qr-image`\)/g,
    replacement: 'api.getGuestQRImage(guestId)',
    description: 'Guest QR Image API'
  }
]

// Function để cập nhật một file
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath)
  let content = fs.readFileSync(fullPath, 'utf8')
  let hasChanges = false
  
  // Check if file already imports api utility
  const hasApiImport = content.includes("import { api }")
  
  // Apply mappings
  apiMappings.forEach(mapping => {
    const oldContent = content
    if (typeof mapping.replacement === 'function') {
      content = content.replace(mapping.pattern, mapping.replacement)
    } else {
      content = content.replace(mapping.pattern, mapping.replacement)
    }
    
    if (content !== oldContent) {
      hasChanges = true
      console.log(`  ✅ ${mapping.description}`)
    }
  })
  
  // Add import if needed and has changes
  if (hasChanges && !hasApiImport) {
    // Find the last import statement
    const importRegex = /^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm
    const imports = content.match(importRegex) || []
    
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1]
      const lastImportIndex = content.lastIndexOf(lastImport)
      const insertIndex = lastImportIndex + lastImport.length
      
      content = content.slice(0, insertIndex) + 
                '\nimport { api } from "../../lib/api"' + 
                content.slice(insertIndex)
    } else {
      // Add at the top if no imports
      content = 'import { api } from "../../lib/api"\n' + content
    }
  }
  
  // Write back if changed
  if (hasChanges) {
    fs.writeFileSync(fullPath, content)
    return true
  }
  
  return false
}

// Process all files
let updatedCount = 0
files.forEach(file => {
  console.log(`\n📝 Processing: ${file}`)
  if (updateFile(file)) {
    updatedCount++
    console.log(`  ✅ Updated`)
  } else {
    console.log(`  ⏭️  No changes needed`)
  }
})

console.log(`\n🎉 Hoàn thành! Đã cập nhật ${updatedCount} files`)
console.log('\n📝 Bước tiếp theo:')
console.log('1. Kiểm tra các files đã được cập nhật')
console.log('2. Test với: npm run dev')
console.log('3. Deploy với: npm run build:prod <your-domain.com>')
