# DialogFooter Component

The `DialogFooter` component provides a fixed footer section for dialogs that contains action buttons and remains visible while scrolling through dialog content.

## Features

- **Fixed Positioning**: Stays at the bottom of the dialog while content scrolls
- **Consistent Styling**: Pre-styled with shadows, borders, and backdrop blur
- **Flexible Content**: Accepts any React components as children
- **Responsive Design**: Adapts to different dialog sizes

## Usage

### Basic Usage

```tsx
import { Modal } from './modal'
import { DialogFooter } from './dialog-footer'
import { Button } from './button'

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="My Dialog"
  footer={
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave}>
        Save
      </Button>
    </DialogFooter>
  }
>
  {/* Dialog content */}
</Modal>
```

### Using the footer prop directly

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="My Dialog"
  footer={
    <>
      <Button variant="outline" onClick={onCancel} className="flex-1">
        Cancel
      </Button>
      <Button onClick={onSave} className="flex-1">
        Save Changes
      </Button>
    </>
  }
>
  {/* Dialog content */}
</Modal>
```

## Props

### DialogFooter Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to render in the footer |
| `className` | `string` | `''` | Additional CSS classes |

### Modal Props (Updated)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `footer` | `ReactNode` | `undefined` | Footer content to render at the bottom |

## Styling

The DialogFooter comes with pre-applied styles:

- **Position**: `sticky bottom-0` - Fixed at the bottom
- **Background**: White with backdrop blur and opacity
- **Border**: Top border with gray color
- **Shadow**: Enhanced shadow for depth
- **Spacing**: Consistent padding and margins
- **Layout**: Flexbox with gap between buttons

## Best Practices

1. **Button Layout**: Use `flex-1` class on buttons for equal width distribution
2. **Button Order**: Place primary actions on the right, secondary actions on the left
3. **Content Scrolling**: Ensure dialog content is scrollable to test footer behavior
4. **Responsive Design**: Test with different dialog sizes and content lengths

## Example with Multiple Actions

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Complex Form"
  footer={
    <>
      <Button variant="outline" onClick={onReset}>
        Reset
      </Button>
      <Button variant="outline" onClick={onPreview}>
        Preview
      </Button>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave}>
        Save & Publish
      </Button>
    </>
  }
>
  {/* Form content */}
</Modal>
```

## Integration with Existing Dialogs

To migrate existing dialogs to use the footer:

1. **Extract Action Buttons**: Move all action buttons from the content area
2. **Add Footer Prop**: Pass the buttons as the `footer` prop
3. **Remove Old Styling**: Remove any custom footer styling from content
4. **Test Scrolling**: Ensure content scrolls properly with fixed footer

## CSS Classes Applied

```css
.sticky bottom-0 bg-white border-t border-gray-200 pt-4 mt-6 -mx-6 px-6 shadow-xl backdrop-blur-sm bg-opacity-95
```

These classes ensure the footer is properly positioned and styled across all dialog sizes and content types.
