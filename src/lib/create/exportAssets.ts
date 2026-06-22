import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import type { CreationSnapshot, PatternGeneratorConfig, ProductId, TextureParams, MaterialParams } from '@/types/create'
import { generatePatternCanvas } from '@/lib/textures/generatePattern'
import { downloadBlob } from '@/lib/workshop/exportUtils'

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function sanitize(input: string) {
  const cleaned = input.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-')
  return cleaned.length > 0 ? cleaned : 'design'
}

function buildBaseName(productName: string, patternName: string | null) {
  return `湖北纹案_${sanitize(productName)}_${sanitize(patternName ?? '无纹样')}`
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('导出失败'))),
      mimeType,
      quality
    )
  })
}

export async function exportPreviewPng(canvas: HTMLCanvasElement, productName: string, patternName: string | null) {
  const blob = await canvasToBlob(canvas, 'image/png')
  const filename = `${buildBaseName(productName, patternName)}_预览_${createTimestamp()}.png`
  downloadBlob(blob, filename)
}

export async function exportPatternPng(
  config: PatternGeneratorConfig,
  size: 512 | 1024 | 2048,
  productName: string,
  patternName: string | null
) {
  const canvas = generatePatternCanvas(config, size)
  const blob = await canvasToBlob(canvas, 'image/png')
  const filename = `${buildBaseName(productName, patternName)}_纹样_${size}px_${createTimestamp()}.png`
  downloadBlob(blob, filename)
}

export function exportCreationJson(
  productId: ProductId,
  patternId: string,
  patternName: string | null,
  textureParams: TextureParams,
  materialParams: MaterialParams,
  productName: string
) {
  const snapshot: CreationSnapshot = {
    productId,
    patternId,
    textureParams,
    materialParams,
    createdAt: new Date().toISOString(),
  }
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const filename = `${buildBaseName(productName, patternName)}_工程_${createTimestamp()}.json`
  downloadBlob(blob, filename)
}

export async function exportModelGlb(root: THREE.Object3D, productName: string, patternName: string | null) {
  const exporter = new GLTFExporter()
  const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      root,
      result => (result instanceof ArrayBuffer ? resolve(result) : reject(new Error('GLB 导出失败'))),
      error => reject(error instanceof Error ? error : new Error('GLB 导出失败')),
      { binary: true, onlyVisible: true }
    )
  })
  const blob = new Blob([glb], { type: 'model/gltf-binary' })
  const filename = `${buildBaseName(productName, patternName)}_模型_${createTimestamp()}.glb`
  downloadBlob(blob, filename)
}
