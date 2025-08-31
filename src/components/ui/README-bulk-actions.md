# Bulk Actions System Documentation

## Overview

The Bulk Actions system provides a comprehensive solution for managing multiple items (ingredients and recipes) simultaneously. It includes selection management, bulk operations, and a user-friendly interface.

## Components

### 1. BulkActions Component

**Location**: `src/components/ui/bulk-actions.tsx`

**Features**:
- Checkbox selection management
- Select all/none functionality
- Bulk delete, export, edit, and category change operations
- Loading states with spinners
- Mobile-responsive design
- Category selection dropdown

**Props**:
```typescript
interface BulkActionsProps<T> {
  data: T[]                           // Array of items
  selectedItems: string[]             // Currently selected item IDs
  onSelectionChange: (ids: string[]) => void  // Selection change handler
  onBulkDelete: (ids: string[]) => void      // Bulk delete handler
  onBulkExport?: (ids: string[]) => void     // Optional bulk export
  onBulkEdit?: (ids: string[]) => void       // Optional bulk edit
  onBulkCategoryChange?: (ids: string[], categoryId: string) => void  // Optional category change
  categories?: Array<{ id: string; name: string; color: string }>     // Available categories
  loading?: boolean                   // Loading state
}
```

### 2. Checkbox Component

**Location**: `src/components/ui/checkbox.tsx`

**Features**:
- Custom styled checkbox
- Accessible with screen reader support
- Smooth animations and hover effects
- Controlled component pattern

**Props**:
```typescript
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}
```

### 3. Enhanced DataTable

**Location**: `src/components/ui/data-table.tsx`

**New Features**:
- Checkbox column for item selection
- Bulk actions integration
- Selection state management
- Responsive design with mobile support

**New Props**:
```typescript
interface DataTableProps<T> {
  // ... existing props
  bulkActions?: React.ReactNode        // Bulk actions component
  selectedItems?: string[]             // Selected item IDs
  onSelectionChange?: (ids: string[]) => void  // Selection change handler
}
```

## API Endpoints

### Bulk Delete

**Ingredients**: `POST /api/ingredients/bulk-delete`
**Recipes**: `POST /api/recipes/bulk-delete`

**Request Body**:
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

**Response**:
```json
{
  "success": true,
  "deletedCount": 3,
  "message": "Successfully deleted 3 ingredients"
}
```

### Bulk Category Update

**Ingredients**: `PATCH /api/ingredients/bulk-category`
**Recipes**: `PATCH /api/recipes/bulk-category`

**Request Body**:
```json
{
  "ids": ["id1", "id2", "id3"],
  "categoryId": "new-category-id"
}
```

**Response**:
```json
{
  "success": true,
  "updatedCount": 3,
  "message": "Successfully updated category for 3 ingredients"
}
```

## Usage Examples

### Basic Implementation

```tsx
import { BulkActions } from '@/components/ui/bulk-actions'

function MyPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [data, setData] = useState<MyItem[]>([])

  const handleBulkDelete = async (ids: string[]) => {
    // Implementation
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      selectedItems={selectedItems}
      onSelectionChange={setSelectedItems}
      bulkActions={
        <BulkActions
          data={data}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onBulkDelete={handleBulkDelete}
        />
      }
    />
  )
}
```

### With All Features

```tsx
<BulkActions
  data={ingredients}
  selectedItems={selectedItems}
  onSelectionChange={setSelectedItems}
  onBulkDelete={handleBulkDelete}
  onBulkExport={handleBulkExport}
  onBulkEdit={handleBulkEdit}
  onBulkCategoryChange={handleBulkCategoryChange}
  categories={categories}
  loading={loading}
/>
```

## Features

### 1. Selection Management
- **Individual Selection**: Click checkboxes to select/deselect items
- **Select All**: Master checkbox to select/deselect all items
- **Selection Counter**: Shows "X dari Y dipilih" format
- **Clear Selection**: Button to clear all selections

### 2. Bulk Operations
- **Delete**: Remove multiple items with confirmation
- **Export**: Export selected items to CSV
- **Edit**: Bulk edit functionality (placeholder for future implementation)
- **Category Change**: Change category for multiple items

### 3. User Experience
- **Loading States**: Spinners during operations
- **Toast Notifications**: Success/error feedback
- **Confirmation Dialogs**: Safety confirmations for destructive actions
- **Mobile Responsive**: Adapts to different screen sizes
- **Keyboard Accessible**: Proper focus management

### 4. Performance
- **Efficient API Calls**: Bulk operations instead of individual calls
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Graceful fallbacks and user feedback

## Mobile Support

The system is fully responsive with:
- Stacked layout on small screens
- Touch-friendly button sizes
- Scrollable category dropdowns
- Optimized spacing for mobile devices

## Security Features

- **Authentication Required**: All bulk operations require valid session
- **Business Isolation**: Users can only operate on their own business data
- **Input Validation**: Proper validation of IDs and data
- **Error Handling**: Secure error messages without data leakage

## Future Enhancements

### Planned Features
1. **Bulk Edit Dialog**: Edit multiple items simultaneously
2. **Bulk Import**: Import multiple items with validation
3. **Undo Operations**: Revert bulk changes
4. **Batch Processing**: Progress indicators for large operations
5. **Custom Bulk Actions**: User-defined bulk operations

### Technical Improvements
1. **WebSocket Integration**: Real-time progress updates
2. **Background Jobs**: Queue system for large operations
3. **Caching**: Optimize repeated operations
4. **Analytics**: Track bulk operation usage

## Troubleshooting

### Common Issues

1. **Checkboxes Not Working**
   - Ensure `onSelectionChange` is properly passed
   - Check that items have unique `id` properties

2. **Bulk Actions Not Showing**
   - Verify `bulkActions` prop is passed to DataTable
   - Check that `data` array is not empty

3. **API Errors**
   - Verify authentication is working
   - Check network tab for specific error messages
   - Ensure API endpoints are properly configured

### Debug Mode

Enable console logging for debugging:
```typescript
// Add to your component
useEffect(() => {
  console.log('Selected Items:', selectedItems)
  console.log('Data:', data)
}, [selectedItems, data])
```

## Best Practices

1. **Always provide user feedback** for bulk operations
2. **Use confirmation dialogs** for destructive actions
3. **Implement proper error handling** with user-friendly messages
4. **Consider performance** when dealing with large datasets
5. **Test on mobile devices** to ensure responsive design
6. **Provide keyboard shortcuts** for power users
7. **Implement undo functionality** where possible

## Contributing

When adding new bulk operations:
1. Create the API endpoint
2. Add the handler function
3. Update the BulkActions component
4. Add proper error handling
5. Include loading states
6. Test thoroughly
7. Update documentation
