import React, { useState, useEffect, useRef } from 'react';
import type { Message, Reply, Attachment } from '../types';
import { AIPanel } from './AIPanel';
import { translateMessage } from '../services/geminiService';
import { TranslateIcon, SendIcon, PaperclipIcon, SpinnerIcon, FileIcon, CheckmarkIcon, XMarkIcon, TrashIcon, WarningIcon } from './icons';

interface MessageDetailProps {
  message: Message | null;
  onSendReply: (messageId: number, replyText: string, attachment?: Attachment) => void;
  isComposing: boolean;
  onSendMessage: (details: { recipients: string[], subject: string, body: string }) => void;
  onCancelCompose: () => void;
  onDeleteMessage: (messageId: number) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ComposeView: React.FC<{
  onSend: (details: { recipients: string[], subject: string, body: string }) => void;
  onCancel: () => void;
}> = ({ onSend, onCancel }) => {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipientList = recipients.split(',').map(r => r.trim()).filter(r => r);
    if (recipientList.length > 0 && subject.trim() && body.trim()) {
      onSend({ recipients: recipientList, subject, body });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Message</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipients</label>
            <input
              type="text"
              id="recipients"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="Separate multiple recipients with commas"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your message..."
              className="w-full h-full min-h-[200px] resize-none px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:bg-gray-400 transition-colors"
            disabled={!recipients.trim() || !subject.trim() || !body.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export const MessageDetail: React.FC<MessageDetailProps> = ({ message, onSendReply, isComposing, onSendMessage, onCancelCompose, onDeleteMessage }) => {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<{ id: number; status: 'scanning' | 'complete' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);


  useEffect(() => {
    setTranslatedText(null);
    setIsTranslating(false);
    setTranslationError(null);
    setReplyText('');
    setSelectedFile(null);
    setScanState(null);
    setIsConfirmingDelete(false);
  }, [message?.id]);

  useEffect(() => {
    if (!selectedFile) {
      setFilePreview(null);
      return;
    }
    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setFilePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setFilePreview(null);
    }
  }, [selectedFile]);
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      // Max height for approx 10 rows (based on line-height) before scrolling
      const maxHeight = 240; 
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [replyText]);


  if (isComposing) {
    return <ComposeView onSend={onSendMessage} onCancel={onCancelCompose} />;
  }

  const handleTranslate = async () => {
    if (!message) return;
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const result = await translateMessage(message.body);
      setTranslatedText(result);
    } catch (err: any) {
      setTranslationError(err.message || 'An unexpected error occurred during translation.');
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleAttachClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
    e.target.value = ''; 
  };
  
  const handleRemoveFile = () => setSelectedFile(null);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((replyText.trim() || selectedFile) && message) {
      let attachment: Attachment | undefined;
      if (selectedFile) {
        attachment = { name: selectedFile.name, size: selectedFile.size };
      }
      onSendReply(message.id, replyText.trim(), attachment);
      setReplyText('');
      setSelectedFile(null);
    }
  };

  const handleDownloadClick = (reply: Reply) => {
    if (!reply.attachment || (scanState && scanState.id === reply.id)) return;

    setScanState({ id: reply.id, status: 'scanning' });
    
    // Simulate scan duration
    setTimeout(() => {
      console.log(`Malware scan complete for ${reply.attachment?.name}. File is safe.`);
      setScanState({ id: reply.id, status: 'complete' });
      
      // Simulate download starting and reset UI after a delay to show 'complete' status
      setTimeout(() => {
        console.log(`Downloading ${reply.attachment?.name}...`);
        setScanState(null);
      }, 1500);
    }, 2500);
  };

  const handleSelectSuggestedReply = (reply: string) => {
    setReplyText(reply);
     setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleConfirmDelete = () => {
    if (message) {
      onDeleteMessage(message.id);
      setIsConfirmingDelete(false);
    }
  };

  if (!message) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium">No message selected</h3>
          <p className="mt-1 text-sm">Select a message from the list to view its contents.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out" aria-modal="true" role="dialog">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full m-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Message</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Are you sure you want to permanently delete this message? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{message.subject}</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={message.avatar} alt={message.sender} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{message.sender}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">to Me</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-400 dark:text-gray-500">{message.timestamp}</p>
              <button onClick={handleTranslate} disabled={isTranslating} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" title="Translate message">
                <TranslateIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button onClick={() => setIsConfirmingDelete(true)} className="p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete message">
                  <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{message.body}</div>
            {(isTranslating || translationError || translatedText) && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {isTranslating && <p className="text-gray-500 dark:text-gray-400 animate-pulse">Translating...</p>}
                {translationError && <p className="text-red-500">Error: {translationError}</p>}
                {translatedText && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">Translation (English)</h4>
                    <div className="prose dark:prose-invert max-w-none">{translatedText}</div>
                  </div>
                )}
              </div>
            )}
            {message.replies && message.replies.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
                {message.replies.map(reply => {
                  const isScanning = scanState?.id === reply.id && scanState.status === 'scanning';
                  const isScanComplete = scanState?.id === reply.id && scanState.status === 'complete';
                  
                  return (
                    <div key={reply.id} className="flex items-start space-x-3">
                      <img src={reply.avatar} alt={reply.sender} className="w-9 h-9 rounded-full" />
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-baseline">
                          <p className="font-semibold text-sm">{reply.sender}</p>
                          <p className="text-xs text-gray-500">{reply.timestamp}</p>
                        </div>
                        {reply.body && <p className="whitespace-pre-wrap">{reply.body}</p>}
                        {reply.attachment && (
                          <div className="mt-3">
                            <div 
                              onClick={() => handleDownloadClick(reply)} 
                              className={`flex items-center p-2 rounded-md bg-gray-200 dark:bg-gray-600 transition-colors ${
                                isScanning || isScanComplete ? 'cursor-wait' : 'hover:bg-gray-300 dark:hover:bg-gray-500 cursor-pointer'
                              }`}
                            >
                              {isScanning ? (
                                <div className="flex items-center w-full">
                                    <SpinnerIcon className="w-5 h-5 mr-3 text-primary-500 animate-spin flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Scanning for threats...</p>
                                        <p className="text-xs text-gray-500">Please wait.</p>
                                    </div>
                                </div>
                              ) : isScanComplete ? (
                                <div className="flex items-center w-full">
                                    <CheckmarkIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Scan complete. Safe!</p>
                                        <p className="text-xs text-gray-500">Starting download...</p>
                                    </div>
                                </div>
                              ) : (
                                <>
                                  <PaperclipIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <div className="flex-1 truncate">
                                    <p className="text-sm font-medium">{reply.attachment.name}</p>
                                    <p className="text-xs text-gray-500">{formatBytes(reply.attachment.size)}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Persistent Footer */}
        <div className="flex-shrink-0">
          <AIPanel message={message} key={message.id} onSelectReply={handleSelectSuggestedReply} />

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
             {selectedFile && (
              <div className="px-3 pb-2">
                <div className="relative flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        {filePreview ? (
                            <img src={filePreview} alt="Selected file preview" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                                <FileIcon className="w-6 h-6 text-gray-500" />
                            </div>
                        )}
                        <div className="truncate">
                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
                        </div>
                    </div>
                    <button onClick={handleRemoveFile} className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white rounded-full hover:bg-red-500 flex items-center justify-center transition-colors" aria-label="Remove attachment">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
              </div>
            )}
            <form onSubmit={handleReplySubmit} className="flex items-end space-x-2">
              <img src="https://i.pravatar.cc/40?u=me" alt="My avatar" className="w-9 h-9 rounded-full flex-shrink-0 mb-1" />
              <div className="flex-1 flex items-center bg-gray-200 dark:bg-gray-700 rounded-2xl focus-within:ring-2 focus-within:ring-primary-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all duration-200">
                 <textarea 
                  ref={textareaRef}
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)} 
                  placeholder={`Reply to ${message.sender}...`} 
                  rows={1} 
                  className="flex-1 w-full resize-none bg-transparent py-2 px-4 focus:outline-none" 
                  onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySubmit(e); }}}
                />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={handleAttachClick} className="p-2 rounded-full text-gray-500 hover:text-primary-500 hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0 mb-1" aria-label="Attach file">
                  <PaperclipIcon className="w-5 h-5" />
              </button>
              <button type="submit" disabled={!replyText.trim() && !selectedFile} className="p-2 rounded-full text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0 mb-1" aria-label="Send reply">
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};