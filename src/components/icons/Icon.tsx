import React from 'react'

interface IconProps {
  name: string
  size?: number
  className?: string
  color?: string
}

export default function Icon({ name, size = 24, className = '', color }: IconProps) {
  const iconComponents: Record<string, React.ReactNode> = {
    'filter_vintage': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
      </svg>
    ),
    'search': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    ),
    'dashboard': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
      </svg>
    ),
    'person': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    ),
    'arrow_forward': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
      </svg>
    ),
    'auto_awesome': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 10h-3.5l2.25-2.25L15 5l-2.25 2.25L10.5 5H7l3.25 3.25L7 11.5 10.5 15H13l-2.25-2.25L15 13l2.25 2.25L19 13l-3.25-3.25L19 10z"/>
      </svg>
    ),
    'landscape': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M14.56 12.99l-2.35 2.36 2.35 2.35M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
      </svg>
    ),
    'storm': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.66 17.66l-1.42 1.42C14.17 19.45 12.13 20 10 20c-4.42 0-8-3.58-8-8s3.58-8 8-8c2.13 0 4.17.55 5.88 1.58L20 8.34c-1.72-1.23-3.83-2-6-2-3.31 0-6 2.69-6 6s2.69 6 6 6c2.17 0 4.28-.77 6-2z"/>
      </svg>
    ),
    'grid_view': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 10h4V6H4v4zm0 8h4v-4H4v4zm8-8h4V6h-4v4zm0 8h4v-4h-4v4zm-8-4h4v-4H4v4zm8 0h4v-4h-4v4zm4-12v4h4V6h-4zm0 8h4v-4h-4v4zm0 8h4v-4h-4v4z"/>
      </svg>
    ),
    'map': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.8c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
      </svg>
    ),
    'schema': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M14 10H4v2h10v-2zm0-4H4v2h10V6zm-8 8h18v-2H6v2zm0 4h18v-2H6v2z"/>
      </svg>
    ),
    'group': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
    'smart_toy': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    ),
    'language': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-13h-2v6h2V7zm0 8h-2v2h2v-2z"/>
      </svg>
    ),
    'share': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
      </svg>
    ),
    'sort': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
      </svg>
    ),
    'chevron_left': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    ),
    'chevron_right': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    ),
    'account_balance': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    ),
    'trending_up': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>
    ),
    'arrow_upward': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
      </svg>
    ),
    'info': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    ),
    'deployed_code': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 10h-3V8.86c1.72-.45 3-2 3-3.86h-3V2h-2v3h-3V2H9v3H6c0 1.86 1.28 3.41 3 3.86V10H4c0 1.86 1.28 3.41 3 3.86V16H4c0 1.86 1.28 3.41 3 3.86V22h2v-3h3v3h2v-3h3c1.72-.45 3-2 3-3.86h-3v-2.14c1.72-.45 3-2 3-3.86zm-5-7h1V4h-1v-.21C15.18 4.14 14.1 5 13 5v1c.55 0 1-.45 1-1zm-2 0c0 .55-.45 1-1 1V5c-1.1 0-2.18-.86-2.99-1.79V3h1v1h1.99c.45 0 .81.34.95.77C10.83 4.53 11 5.24 11 6v1zm-2 6h1v-1c-.55 0-1 .45-1 1V14c1.1 0 2.18.86 2.99 1.79V18h-1v-1h-1.99c-.45 0-.81-.34-.95-.77C10.83 15.47 11 14.76 11 14v-1zm2 0c0-.55.45-1 1-1v1c1.1 0 2.18.86 2.99 1.79V18h-1v-1h-1.99c-.45 0-.81-.34-.95-.77C13.17 15.47 13 14.76 13 14v-1zm2-6h1v1c-.55 0-1-.45-1-1V6c-1.1 0-2.18.86-2.99 1.79V10h1V9h1.99c.45 0 .81-.34.95-.77C13.17 8.53 13 7.76 13 7v-1z"/>
      </svg>
    ),
    'brush': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41zM19.13 9.8c.42-.24.66-.74.54-1.22l-1.37-4.11c-.12-.37-.46-.62-.85-.62h-4.54l9.37 9.37c.09-.32.16-.66.16-1.01v-3.25zM10.89 21.1c.19.19.45.29.71.29s.52-.1.71-.29l1.41-1.41a.9959.9959 0 0 0 0-1.41l-1.41-1.41a.9959.9959 0 0 0-1.41 0l-1.41 1.41a.9959.9959 0 0 0 0 1.41l1.41 1.41z"/>
      </svg>
    ),
    'layers': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    'photo_camera': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    ),
    'zoom_in': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm3-4h-2v2H8v-2H6v-1h2V7h1v2h2v1z"/>
      </svg>
    ),
    'sync': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
    ),
    'add_circle': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
      </svg>
    ),
    'check': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    ),
    'tune': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16.2c-3.97 0-7.2-3.23-7.2-7.2S8.03 4.8 12 4.8s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2zm-1.5-10.2c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm3 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm3 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
      </svg>
    ),
    'auto_awesome': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 10h-3.5l2.25-2.25L15 5l-2.25 2.25L10.5 5H7l3.25 3.25L7 11.5 10.5 15H13l-2.25-2.25L15 13l2.25 2.25L19 13l-3.25-3.25L19 10z"/>
      </svg>
    ),
    'download': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
    ),
    'category': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
    ),
    'bookmark': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
      </svg>
    ),
    'add': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    ),
    'remove': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 13H5v-2h14v2z"/>
      </svg>
    ),
    'my_location': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-10C7.79 4 4 7.79 4 12s3.79 8 8 8 8-3.79 8-8-3.79-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
      </svg>
    )
  }

  return iconComponents[name] || null
}