# Image Editor Application

A high-performance, scalable web application built with Angular that serves as an intuitive image editor for content creators.

## 🚀 Features

### Image Editing Capabilities
- **Crop**: Select and crop images to desired dimensions
- **Rotate**: Rotate images by 90-degree increments
- **Flip**: Flip images horizontally or vertically
- **Zoom**: Zoom in/out with a slider control (0.1x to 3x)
- **Pan**: Navigate around zoomed images
- **Resize**: Adjust image dimensions

### Annotation Tools
- **Text Insertion**: Add text overlays with customizable font size and color
- **Shapes**: Add rectangles, circles, and lines
- **Freehand Drawing**: Draw directly on the canvas (coming soon)
- **Arrows**: Add directional indicators (coming soon)

### Export Capabilities
- **JPEG Export**: High-quality JPEG format with configurable quality
- **PNG Export**: Lossless PNG format with transparency support
- **SVG Export**: Scalable vector graphics format

### User Experience
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Touch-Friendly**: Optimized for touch interactions
- **Undo/Redo**: History management for all editing operations
- **Real-time Preview**: See changes instantly as you edit

## 🛠️ Technical Architecture

### Frontend Framework
- **Angular 20**: Latest version with standalone components
- **TypeScript**: Type-safe development
- **SCSS**: Advanced styling with CSS preprocessor

### State Management
- **NgRx**: Redux-style state management
- **Actions**: Centralized action creators
- **Reducers**: Immutable state updates
- **Effects**: Side effect handling
- **Selectors**: Efficient state queries

### Image Processing
- **HTML5 Canvas API**: Native browser image manipulation
- **Fabric.js**: Advanced canvas library for complex operations
- **Custom Services**: Modular image editing services

### UI Components
- **Angular Material**: Material Design components
- **Custom Components**: Tailored image editing interface
- **Responsive Layout**: Mobile-first design approach

### Error Handling & Logging
- **Global Error Handler**: Prevents crashes and provides graceful degradation
- **Comprehensive Logging**: Debug and monitor application behavior
- **User Feedback**: Clear error messages and loading states

### Performance Optimizations
- **Lazy Loading**: On-demand module loading
- **Change Detection**: OnPush strategy for better performance
- **Memory Management**: Proper cleanup and disposal
- **Async Operations**: Non-blocking image processing

## 📦 Installation & Setup

### Prerequisites
- Node.js v20.19+ or v22.12+
- npm v10.0+

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd image-editor-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Build for Production

```bash
npm run build
```

The built application will be in the `dist/image-editor-app` directory.

## 🎯 Usage Guide

### Getting Started

1. **Load an Image**
   - Click the folder icon in the toolbar
   - Select an image file from your device
   - The image will be loaded and displayed on the canvas

2. **Basic Editing**
   - **Rotate**: Click the rotate button to rotate 90° clockwise
   - **Flip**: Use the flip buttons for horizontal or vertical flipping
   - **Zoom**: Use the slider to zoom in/out
   - **Crop**: Select the crop tool and drag to select area

3. **Adding Annotations**
   - **Text**: Click the text tool, enter text, and click on canvas
   - **Shapes**: Select shape tool and choose rectangle, circle, or line
   - **Colors**: Use the color picker to customize appearance

4. **Export Your Work**
   - Click the export buttons (JPEG, PNG, or SVG)
   - The file will be automatically downloaded

### Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo
- `Ctrl+S` / `Cmd+S`: Save (export as PNG)

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       ├── image-editor.service.ts
│   │       ├── logging.service.ts
│   │       └── error-handler.service.ts
│   ├── features/
│   │   └── image-editor/
│   │       └── image-editor.component.ts
│   ├── store/
│   │   ├── actions/
│   │   │   └── image-editor.actions.ts
│   │   ├── effects/
│   │   │   └── image-editor.effects.ts
│   │   ├── reducers/
│   │   │   └── image-editor.reducer.ts
│   │   ├── selectors/
│   │   │   └── image-editor.selectors.ts
│   │   └── state/
│   │       └── app.state.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
└── styles/
```

## 🔧 Configuration

### Environment Variables
Create `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  defaultQuality: 0.9
};
```

### Customization
- **Canvas Size**: Modify canvas dimensions in `image-editor.component.ts`
- **Supported Formats**: Update format restrictions in the service
- **UI Theme**: Customize Angular Material theme in `styles.scss`

## 🚀 Deployment

### Build for Production
```bash
npm run build:prod
```

### Deploy to Static Hosting
The application can be deployed to any static hosting service:
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your repository
- **GitHub Pages**: Use GitHub Actions
- **AWS S3**: Upload to S3 bucket

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔮 Roadmap

### Upcoming Features
- [ ] Advanced drawing tools
- [ ] Layer management
- [ ] Filters and effects
- [ ] Batch processing
- [ ] Cloud storage integration
- [ ] Collaborative editing
- [ ] Plugin system

### Performance Improvements
- [ ] Web Workers for heavy operations
- [ ] Virtual scrolling for large images
- [ ] Progressive image loading
- [ ] Caching strategies

---

**Built with ❤️ using Angular and modern web technologies**
