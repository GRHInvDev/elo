"use client"

import { useEffect, useRef, useState } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import type { editor } from "monaco-editor"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MonacoEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  height?: string
  className?: string
  language?: string
  readOnly?: boolean
  theme?: "light" | "vs-dark"
  showToolbar?: boolean
}

// Templates de slash commands
const SLASH_COMMANDS: Record<string, string> = {
  "/link": "[Link](https://exemplo.com)",
  "/image": "![Alt text](https://exemplo.com/imagem.jpg)",
  "/code": "```\n// código aqui\n```",
  "/quote": "> Citação aqui",
  "/list": "- Item 1\n- Item 2\n- Item 3",
  "/numbered": "1. Item 1\n2. Item 2\n3. Item 3",
  "/h1": "# Título 1",
  "/h2": "## Título 2",
  "/h3": "### Título 3",
  "/bold": "**texto em negrito**",
  "/italic": "*texto em itálico*",
  "/table": "| Coluna 1 | Coluna 2 |\n|----------|----------|\n| Dado 1   | Dado 2   |",
}

export function MonacoEditor({
  value,
  onChange,
  height = "400px",
  className,
  language = "markdown",
  readOnly = false,
  theme = "vs-dark",
  showToolbar = true,
}: MonacoEditorProps) {
  const [mounted, setMounted] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configurar opções específicas para Markdown
    monaco.languages.setLanguageConfiguration("markdown", {
      comments: {
        lineComment: "<!--",
        blockComment: ["<!--", "-->"],
      },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: "`", close: "`" },
        { open: "*", close: "*" },
        { open: "_", close: "_" },
        { open: "#", close: "#" },
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: "`", close: "`" },
        { open: "*", close: "*" },
        { open: "_", close: "_" },
      ],
    })

    // Configurar tema dark
    monaco.editor.setTheme("vs-dark")

    // Configurar cor de fundo preta
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#000000",
      },
    })
    monaco.editor.setTheme("custom-dark")

    // Funções auxiliares para formatação
    const getSelectedText = (): string | null => {
      const selection = editor.getSelection()
      if (!selection || selection.isEmpty()) return null
      const model = editor.getModel()
      if (!model) return null
      return model.getValueInRange(selection)
    }

    const insertMarkdown = (before: string, after: string = "") => {
      const selection = editor.getSelection()
      if (!selection) return

      const model = editor.getModel()
      if (!model) return

      const selectedText = model.getValueInRange(selection)
      const newText = selectedText 
        ? `${before}${selectedText}${after}`
        : `${before}${after}`

      editor.executeEdits("format", [
        {
          range: selection,
          text: newText,
        },
      ])

      // Reposicionar cursor
      if (!selectedText) {
        const newPosition = {
          lineNumber: selection.startLineNumber,
          column: selection.startColumn + before.length,
        }
        editor.setPosition(newPosition)
      }
    }

    const insertAtCursor = (text: string) => {
      const position = editor.getPosition()
      if (!position) return

      const model = editor.getModel()
      if (!model) return

      const range = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      )

      editor.executeEdits("insert", [
        {
          range,
          text,
        },
      ])
    }

    // Registrar comandos de teclado
    // Ctrl+B ou Cmd+B - Negrito
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      insertMarkdown("**", "**")
    })

    // Ctrl+I ou Cmd+I - Itálico
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      insertMarkdown("*", "*")
    })

    // Ctrl+K ou Cmd+K - Link
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selected = getSelectedText()
      if (selected) {
        insertMarkdown("[", `](${selected})`)
      } else {
        insertAtCursor("[Link](https://exemplo.com)")
      }
    })

    // Ctrl+` ou Cmd+` - Código inline
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
      insertMarkdown("`", "`")
    })

    // Ctrl+1 ou Cmd+1 - Título 1
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit1, () => {
      insertMarkdown("# ", "")
    })

    // Ctrl+2 ou Cmd+2 - Título 2
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit2, () => {
      insertMarkdown("## ", "")
    })

    // Ctrl+3 ou Cmd+3 - Título 3
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit3, () => {
      insertMarkdown("### ", "")
    })

    // Ctrl+Shift+L ou Cmd+Shift+L - Lista
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {
      insertAtCursor("- ")
    })

    // Ctrl+Shift+O ou Cmd+Shift+O - Lista numerada
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO, () => {
      insertAtCursor("1. ")
    })

    // Ctrl+Shift+Q ou Cmd+Shift+Q - Citação
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyQ, () => {
      insertMarkdown("> ", "")
    })

    // Sugestões de slash commands
    monaco.languages.registerCompletionItemProvider("markdown", {
      provideCompletionItems: (model, position) => {
        const line = model.getLineContent(position.lineNumber)
        const textBeforeCursor = line.substring(0, position.column - 1)
        
        // Verificar se está digitando um slash command
        const match = textBeforeCursor.match(/\/(\w*)$/)
        if (!match) return { suggestions: [] }

        const suggestions = Object.keys(SLASH_COMMANDS)
          .filter(cmd => cmd.startsWith(`/${match[1]}`))
          .map((cmd) => ({
            label: cmd,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: SLASH_COMMANDS[cmd]!,
            documentation: `Insere: ${SLASH_COMMANDS[cmd]}`,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column - match[0].length,
              endColumn: position.column,
            },
          }))
        
        return { suggestions }
      },
      triggerCharacters: ["/"],
    })
  }

  const getSelectedText = (): string | null => {
    if (!editorRef.current) return null
    
    const selection = editorRef.current.getSelection()
    if (!selection || selection.isEmpty()) return null

    const model = editorRef.current.getModel()
    if (!model) return null

    return model.getValueInRange(selection)
  }

  const insertMarkdown = (before: string, after: string = "") => {
    if (!editorRef.current) return

    const selection = editorRef.current.getSelection()
    if (!selection) return

    const model = editorRef.current.getModel()
    if (!model) return

    const selectedText = model.getValueInRange(selection)
    const newText = selectedText 
      ? `${before}${selectedText}${after}`
      : `${before}${after}`

    editorRef.current.executeEdits("format", [
      {
        range: selection,
        text: newText,
      },
    ])

    // Reposicionar cursor
    if (!selectedText) {
      const newPosition = {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn + before.length,
      }
      editorRef.current.setPosition(newPosition)
    }
  }

  const insertAtCursor = (text: string) => {
    if (!editorRef.current) return

    const position = editorRef.current.getPosition()
    if (!position) return

    const model = editorRef.current.getModel()
    if (!model) return

    const range = new monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column
    )

    editorRef.current.executeEdits("insert", [
      {
        range,
        text,
      },
    ])
  }

  const formatBold = () => insertMarkdown("**", "**")
  const formatItalic = () => insertMarkdown("*", "*")
  const formatCode = () => insertMarkdown("`", "`")
  const formatLink = () => {
    const selected = getSelectedText()
    if (selected) {
      insertMarkdown("[", `](${selected})`)
    } else {
      insertAtCursor("[Link](https://exemplo.com)")
    }
  }
  const formatHeading1 = () => insertMarkdown("# ", "")
  const formatHeading2 = () => insertMarkdown("## ", "")
  const formatHeading3 = () => insertMarkdown("### ", "")
  const formatList = () => insertAtCursor("- ")
  const formatOrderedList = () => insertAtCursor("1. ")
  const formatQuote = () => insertMarkdown("> ", "")

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex items-center justify-center border rounded-md bg-black",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Carregando editor...</p>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-md overflow-hidden bg-black", className)}>
      {showToolbar && !readOnly && (
        <div className="flex items-center gap-1 p-2 border-b bg-black/50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatBold}
                  className="h-8 w-8 p-0"
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Negrito</div>
                <div className="text-xs text-muted-foreground">Ctrl+B ou Cmd+B</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatItalic}
                  className="h-8 w-8 p-0"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Itálico</div>
                <div className="text-xs text-muted-foreground">Ctrl+I ou Cmd+I</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatCode}
                  className="h-8 w-8 p-0"
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Código inline</div>
                <div className="text-xs text-muted-foreground">Ctrl+` ou Cmd+`</div>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatHeading1}
                  className="h-8 w-8 p-0"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Título 1</div>
                <div className="text-xs text-muted-foreground">Ctrl+1 ou Cmd+1</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatHeading2}
                  className="h-8 w-8 p-0"
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Título 2</div>
                <div className="text-xs text-muted-foreground">Ctrl+2 ou Cmd+2</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatHeading3}
                  className="h-8 w-8 p-0"
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Título 3</div>
                <div className="text-xs text-muted-foreground">Ctrl+3 ou Cmd+3</div>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatList}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Lista</div>
                <div className="text-xs text-muted-foreground">Ctrl+Shift+L ou Cmd+Shift+L</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatOrderedList}
                  className="h-8 w-8 p-0"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Lista numerada</div>
                <div className="text-xs text-muted-foreground">Ctrl+Shift+O ou Cmd+Shift+O</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatQuote}
                  className="h-8 w-8 p-0"
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Citação</div>
                <div className="text-xs text-muted-foreground">Ctrl+Shift+Q ou Cmd+Shift+Q</div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatLink}
                  className="h-8 w-8 p-0"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Link</div>
                <div className="text-xs text-muted-foreground">Ctrl+K ou Cmd+K</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="custom-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: "on",
          snippetSuggestions: "top",
          wordBasedSuggestions: "matchingDocuments",
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
        }}
      />
    </div>
  )
}

