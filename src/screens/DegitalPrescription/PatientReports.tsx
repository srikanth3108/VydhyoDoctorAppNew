import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { pick, types } from "@react-native-documents/picker";
import { authdelete, AuthFetch, UploadFiles } from "../../auth/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import WebView from "react-native-webview";
import Pdf from "react-native-pdf";
import RNFS from "react-native-fs";
import {
  FONT_SIZE,
  LAYOUT,
  moderateScale,
  responsiveText,
  SPACING,
} from "../../utility/responsive";

// ─────────────── constants ───────────────
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Maps MIME → file extension for download naming
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// ─────────────── helpers ───────────────
const formatFileSize = (bytes: number) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const TYPE_LABEL: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

const getTypeLabel = (mime: string) => TYPE_LABEL[mime] ?? "FILE";

const getFileExtension = (url: string) => {
  const match = url?.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : "";
};

const isImage = (mime: string) => mime?.startsWith("image/");
const isPdf = (mime: string) => mime === "application/pdf";
const isWord = (mime: string) =>
  mime === "application/msword" ||
  mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Sanitize a string so it is safe to use as a filename on both iOS and Android.
 * Replaces any character that is not alphanumeric, dash, underscore, or dot
 * with an underscore, and collapses consecutive underscores.
 */
const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

/**
 * Build a safe download destination path.
 * Priority:
 *  1. Use originalName (sanitized) if it already carries the right extension.
 *  2. Derive extension from MIME type.
 *  3. Fallback to extension extracted from the URL.
 *  4. Last resort: "file".
 */
const buildDownloadPath = (file: {
  originalName?: string;
  fileType?: string;
  fileUrl?: string;
}): string => {
  const mimeExt = file.fileType ? MIME_TO_EXT[file.fileType] : undefined;
  const urlExt = file.fileUrl ? getFileExtension(file.fileUrl) : "";

  let baseName = file.originalName
    ? sanitizeFileName(file.originalName)
    : `document_${Date.now()}`;

  // Strip any existing extension from baseName so we can control it precisely
  const dotIdx = baseName.lastIndexOf(".");
  const baseWithoutExt =
    dotIdx > 0 ? baseName.substring(0, dotIdx) : baseName;

  const ext = mimeExt || urlExt || "file";
  const finalName = `${baseWithoutExt}.${ext}`;

  // Choose directory
  let dir: string;
  if (Platform.OS === "android") {
    // DownloadDirectoryPath is the public Downloads folder — preferred on Android
    dir = RNFS.DownloadDirectoryPath;
  } else {
    // On iOS use the app's document directory (accessible via Files app if
    // UIFileSharingEnabled / LSSupportsOpeningDocumentsInPlace are set in Info.plist)
    dir = RNFS.DocumentDirectoryPath;
  }

  return `${dir}/${finalName}`;
};

// ─────────────── DownloadToast ───────────────
interface DownloadToastProps {
  visible: boolean;
  fileName: string;
  status: "downloading" | "success" | "error";
}

const DownloadToast: React.FC<DownloadToastProps> = ({
  visible,
  fileName,
  status,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const bgColor =
    status === "success"
      ? "#1C3D2E"
      : status === "error"
      ? "#3D1C1C"
      : "#1A1A18";
  const icon =
    status === "success" ? "✅" : status === "error" ? "❌" : "⬇️";
  const label =
    status === "success"
      ? "Downloaded successfully"
      : status === "error"
      ? "Download failed"
      : "Downloading…";

  return (
    <Animated.View
      style={[
        toastStyles.container,
        { backgroundColor: bgColor, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={toastStyles.icon}>{icon}</Text>
      <View style={toastStyles.textWrap}>
        <Text style={toastStyles.label}>{label}</Text>
        <Text style={toastStyles.fileName} numberOfLines={1}>
          {fileName}
        </Text>
      </View>
      {status === "downloading" && (
        <ActivityIndicator color="#fff" size="small" />
      )}
    </Animated.View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 16,
    paddingBottom: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  label: { fontSize: 13, fontWeight: "600", color: "#fff" },
  fileName: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },
});

// ─────────────── PreviewContent ───────────────
interface PreviewContentProps {
  fileType: string;
  fileUrl?: string;
  localUri?: string;
  fileName?: string;
}

const PreviewContent: React.FC<PreviewContentProps> = ({
  fileType,
  fileUrl,
  localUri,
  fileName,
}) => {
  const [localFilePath, setLocalFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const uri = fileUrl || localUri;

  useEffect(() => {
    prepareLocalFile();
  }, [uri]);

  const prepareLocalFile = async () => {
    try {
      if (!localUri) return;

      // Already a file:// path
      if (localUri.startsWith("file://")) {
        setLocalFilePath(localUri);
        return;
      }

      // Android content:// — copy to cache so react-native-pdf can read it
      if (Platform.OS === "android" && localUri.startsWith("content://")) {
        setLoading(true);
        const ext = fileName?.split(".").pop() || "pdf";
        const destinationPath = `${RNFS.CachesDirectoryPath}/${Date.now()}.${ext}`;
        await RNFS.copyFile(localUri, destinationPath);
        setLocalFilePath(`file://${destinationPath}`);
      }
    } catch (e) {
      console.log("Local file prepare error:", e);
    } finally {
      setLoading(false);
    }
  };

  // ───── IMAGE ─────
  if (isImage(fileType) && uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.modalPreviewImg}
        resizeMode="contain"
      />
    );
  }

  // ───── PDF ─────
  if (isPdf(fileType)) {
    const pdfUri = fileUrl || localFilePath;

    if (loading) {
      return (
        <View style={styles.pdfLoader}>
          <ActivityIndicator size="large" color="#1A1A18" />
        </View>
      );
    }

    if (!pdfUri) {
      return (
        <View style={styles.docPlaceholder}>
          <Text style={{ fontSize: 48 }}>📄</Text>
          <Text style={styles.docPlaceholderSub}>
            Unable to load PDF preview
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.pdfContainer}>
        <Pdf
          source={{ uri: pdfUri, cache: true }}
          style={styles.pdf}
          trustAllCerts={false}
          onLoadComplete={(pages) => console.log("PDF Loaded:", pages)}
          onError={(error) => {
            console.log("PDF Error:", error);
            Alert.alert("Preview Error", "Unable to preview PDF");
          }}
          renderActivityIndicator={() => (
            <ActivityIndicator
              size="large"
              color="#1A1A18"
              style={{ marginTop: 20 }}
            />
          )}
        />
      </View>
    );
  }

  // ───── WORD ─────
  if (isWord(fileType)) {
    if (fileUrl) {
      const googleViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        fileUrl
      )}`;
      return (
        <View style={styles.webviewWrap}>
          <WebView
            source={{ uri: googleViewer }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator
                style={{ flex: 1 }}
                size="large"
                color="#1A1A18"
              />
            )}
          />
        </View>
      );
    }

    return (
      <View style={styles.docPlaceholder}>
        <Text style={{ fontSize: 48 }}>📝</Text>
        <Text style={styles.docPlaceholderTitle}>{fileName}</Text>
        <Text style={styles.docPlaceholderSub}>
          DOC/DOCX preview is available after upload
        </Text>
      </View>
    );
  }

  // ───── FALLBACK ─────
  return (
    <View style={styles.docPlaceholder}>
      <Text style={{ fontSize: 48 }}>📄</Text>
      <Text style={styles.docPlaceholderSub}>Preview not available</Text>
    </View>
  );
};

// ─────────────── main component ───────────────
const PatientReports = () => {
  const route = useRoute<any>();
  const { patientDetails, formData: initialFormData } = route.params;
  const navigation = useNavigation<any>();

  const [reports, setReports] = useState<any[]>([]);
  const [stagedFiles, setStagedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [preview, setPreview] = useState<{
    type: "staged" | "uploaded";
    item: any;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // download toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastFileName, setToastFileName] = useState("");
  const [toastStatus, setToastStatus] = useState<
    "downloading" | "success" | "error"
  >("downloading");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (
    fileName: string,
    status: "downloading" | "success" | "error",
    autoDismiss?: number
  ) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastFileName(fileName);
    setToastStatus(status);
    setToastVisible(true);
    if (autoDismiss) {
      toastTimerRef.current = setTimeout(
        () => setToastVisible(false),
        autoDismiss
      );
    }
  };

  // ── fetch reports ──
  const fetchReports = async (page: number = 1) => {
    const storedToken = await AsyncStorage.getItem("authToken");
    if (!patientDetails?.patientId || !storedToken) return;
    setLoadingReports(true);
    try {
      const res = await AuthFetch(
        `documents/getdocumentsByPatientId/${patientDetails.patientId}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        storedToken
      );
    //   console.log("Fetched reports:", res);
      if (res.status === "success" && res.data) {
        setReports(res.data?.data || []);
        setCurrentPage(res.data?.pagination?.currentPage || page);
        setTotalPages(res.data?.pagination?.totalPages || 1);
        setTotalDocuments(res.data?.pagination?.totalDocuments || 0);
      }
    } catch {
      Alert.alert("Error", "Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (patientDetails?.patientId) {
      fetchReports(1);
    }
  }, [patientDetails?.patientId]);

  // ── pick files ──
  const pickFiles = async () => {
    try {
      const res = await pick({
        type: [types.allFiles],
        allowMultiSelection: true,
      });

      const valid: any[] = [];
      const skipped: string[] = [];

      res.forEach((f) => {
        if (!ACCEPTED.includes(f.type ?? "")) {
          skipped.push(`${f.name} (unsupported type)`);
          return;
        }
        if ((f.size ?? 0) > MAX_FILE_SIZE) {
          skipped.push(`${f.name} (exceeds 3 MB)`);
          return;
        }
        valid.push({ id: `${Date.now()}-${Math.random()}`, file: f });
      });

      if (skipped.length > 0) {
        Alert.alert(
          "Some files skipped",
          skipped.join("\n") +
            "\n\nAccepted: JPG, PNG, PDF, DOC, DOCX · Max size: 3 MB"
        );
      }

      if (valid.length > 0) setStagedFiles((p) => [...p, ...valid]);
    } catch (err: any) {
      if (err?.code === "DOCUMENT_PICKER_CANCELED") return;
      Alert.alert("Error", "File selection failed");
    }
  };

  const removeStaged = (id: string) =>
    setStagedFiles((p) => p.filter((f) => f.id !== id));

  // ── upload ──
  const handleUpload = async () => {
    if (!stagedFiles.length) return;
    setUploading(true);
    const formData = new FormData();
    stagedFiles.forEach((item) => {
      formData.append("files", {
        uri: item.file.uri,
        name: item.file.name,
        type: item.file.type,
      } as any);
    });
    formData.append("patientId", patientDetails.patientId);
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }
      const res = await UploadFiles(
        "documents/upload-documents",
        formData,
        storedToken
      );
      if (res.status === "success") {
        Alert.alert("Success", "Files uploaded successfully");
        setStagedFiles([]);
        // Reset to first page to see new uploads
        fetchReports(1);
      } else {
        Alert.alert("Error", "Upload failed");
      }
    } catch {
      Alert.alert("Error", "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }
      const res = await authdelete(
        `documents/deleteDocument/${deleteTarget._id}`,
        {},
        storedToken
      );
      if (res.status === "success") {
        setReports((p) => p.filter((r) => r._id !== deleteTarget._id));
        setDeleteTarget(null);
        // Refresh if current page is now empty
        if (reports.length === 1 && currentPage > 1) {
          fetchReports(currentPage - 1);
        } else {
          fetchReports(currentPage);
        }
      }
    } catch {
      Alert.alert("Error", "Delete failed");
    }
  };

  // ── download ──
  const handleDownload = async (file: any) => {
    if (!file?.fileUrl) {
      Alert.alert("Error", "File URL not available");
      return;
    }

    // Build a sanitized destination path
    const downloadPath = buildDownloadPath({
      originalName: file.originalName,
      fileType: file.fileType,
      fileUrl: file.fileUrl,
    });

    // Friendly display name for the toast (keep original if available)
    const displayName = file.originalName || downloadPath.split("/").pop()!;

    showToast(displayName, "downloading");

    try {
      // ── Ensure the target directory exists ──
      // This is the root cause of most ENOENT errors.
      const dir = downloadPath.substring(0, downloadPath.lastIndexOf("/"));
      const dirExists = await RNFS.exists(dir);
      if (!dirExists) {
        await RNFS.mkdir(dir);
      }

      // ── Remove stale file at the same path if any ──
      const fileExists = await RNFS.exists(downloadPath);
      if (fileExists) {
        await RNFS.unlink(downloadPath);
      }

      console.log("Download starting:", {
        fromUrl: file.fileUrl,
        toFile: downloadPath,
      });

      const result = await RNFS.downloadFile({
        fromUrl: file.fileUrl,
        toFile: downloadPath,
        background: true,
        discretionary: true,
      }).promise;

      console.log("Download result:", result);

      if (result.statusCode === 200) {
        showToast(displayName, "success", 3500);

        // On Android, notify the media scanner so the file
        // appears immediately in Downloads / Gallery.
        if (Platform.OS === "android") {
          try {
            await RNFS.scanFile(downloadPath);
          } catch (scanErr) {
            // Non-fatal — file is still saved.
            console.log("Media scan warning:", scanErr);
          }
        }
      } else {
        console.error("Unexpected status code:", result.statusCode);
        showToast(displayName, "error", 3000);
        Alert.alert(
          "Download Error",
          `Server returned status ${result.statusCode}. Please try again.`
        );
      }
    } catch (error: any) {
      console.error("Download error:", error);
      showToast(displayName, "error", 3000);

      // Provide a more specific message for the common ENOENT case
      const message =
        error?.message?.includes("ENOENT") ||
        error?.message?.includes("no such file")
          ? "Could not create the file. Please check storage permissions and try again."
          : error?.message || "Unable to download file. Please try again.";

      Alert.alert("Download Failed", message);
    }
  };

  // ── render uploaded card ──
  const renderReport = ({ item }: { item: any }) => {
    const img = isImage(item.fileType);
    return (
      <Pressable
        style={styles.card}
        onPress={() => setPreview({ type: "uploaded", item })}
      >
        <View style={styles.thumb}>
          {img ? (
            <Image
              source={{ uri: item.fileUrl }}
              style={styles.img}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.fileIcon}>
              {isPdf(item.fileType)
                ? "📄"
                : isWord(item.fileType)
                ? "📝"
                : "📁"}
            </Text>
          )}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {getTypeLabel(item.fileType)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text numberOfLines={1} style={styles.title}>
            {item.originalName}
          </Text>
          <Text style={styles.sub}>
            {formatDate(item.createdAt)}
            {item.fileSize ? `  ·  ${formatFileSize(item.fileSize)}` : ""}
          </Text>
        </View>

        <View style={styles.row}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => setPreview({ type: "uploaded", item })}
          >
            <Text style={styles.actionView}>👁 View</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable
            style={styles.actionBtn}
            onPress={() => handleDownload(item)}
          >
            <Text style={styles.actionDownload}>⬇ Save</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable
            style={styles.actionBtn}
            onPress={() => setDeleteTarget(item)}
          >
            <Text style={styles.actionDelete}>🗑 Del</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const handleNext = () => {
    navigation.navigate("AdviceFollowup", {
      patientDetails,
      formData: initialFormData,
    });
  };

  // resolved preview values
  const previewItem = preview?.item;
  const previewFileType =
    preview?.type === "staged"
      ? previewItem?.file?.type
      : previewItem?.fileType;
  const previewFileName =
    preview?.type === "staged"
      ? previewItem?.file?.name
      : previewItem?.originalName;
  const previewLocalUri =
    preview?.type === "staged" ? previewItem?.file?.uri : undefined;
  const previewFileUrl =
    preview?.type === "uploaded" ? previewItem?.fileUrl : undefined;

  // ── UI ──
  return (
    <View style={styles.container}>
      {/* ── Download Toast ── */}
      <DownloadToast
        visible={toastVisible}
        fileName={toastFileName}
        status={toastStatus}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Patient Reports</Text>
          <Text style={styles.headerSub}>
            {reports.length} document{reports.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable style={styles.uploadBtn} onPress={pickFiles}>
          <Text style={styles.uploadBtnText}>+ Add Files</Text>
        </Pressable>
      </View>

      {/* ── Staged files ── */}
      {stagedFiles.length > 0 && (
        <View style={styles.stagedArea}>
          <Text style={styles.stagedLabel}>
            Pending upload · {stagedFiles.length} file
            {stagedFiles.length !== 1 ? "s" : ""}
          </Text>

          {stagedFiles.map((f) => {
            const canPreview =
              isImage(f.file.type) ||
              isPdf(f.file.type) ||
              isWord(f.file.type);
            return (
              <View key={f.id} style={styles.stagedFile}>
                <View style={styles.stagedFileMeta}>
                  <Text style={styles.stagedFileIcon}>
                    {isImage(f.file.type)
                      ? "🖼"
                      : isPdf(f.file.type)
                      ? "📄"
                      : isWord(f.file.type)
                      ? "📝"
                      : "📁"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stagedFileName} numberOfLines={1}>
                      {f.file.name}
                    </Text>
                    <Text style={styles.stagedFileSize}>
                      {formatFileSize(f.file.size)}
                    </Text>
                  </View>
                </View>
                <View style={styles.stagedFileActions}>
                  {canPreview && (
                    <Pressable
                      style={styles.stagedPreviewBtn}
                      onPress={() =>
                        setPreview({ type: "staged", item: f })
                      }
                    >
                      <Text style={styles.stagedPreviewText}>Preview</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => removeStaged(f.id)}>
                    <Text style={styles.stagedRemove}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <View style={styles.stagedActions}>
            <Pressable
              style={styles.btnGhost}
              onPress={() => setStagedFiles([])}
            >
              <Text style={styles.btnGhostText}>Clear all</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, { flex: 1 }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  Upload {stagedFiles.length} file
                  {stagedFiles.length !== 1 ? "s" : ""}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Reports grid ── */}
      <Text style={styles.sectionLabel}>Uploaded Documents</Text>

      {loadingReports ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#888780" />
      ) : reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🗂️</Text>
          <Text style={styles.emptyText}>No documents uploaded yet</Text>
          <Text style={styles.emptyHint}>
            JPG · PNG · PDF · DOC · DOCX · Max 3 MB
          </Text>
        </View>
      ) : (
        <>
          

          <FlatList
            data={reports}
            keyExtractor={(i) => i._id}
            renderItem={renderReport}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          {/* Pagination Controls - Top */}
          <View style={styles.paginationSimple}>
            <Text style={styles.paginationSimpleText}>
              Page {currentPage} of {totalPages} • {totalDocuments} total
            </Text>
            <View style={styles.paginationSimpleButtons}>
              <Pressable
                onPress={() => fetchReports(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                <Text style={styles.paginationSimpleBtn}>← Previous</Text>
              </Pressable>
              <Pressable
                onPress={() => fetchReports(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                <Text style={styles.paginationSimpleBtn}>Next →</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* ═══════════ PREVIEW MODAL ═══════════ */}
      <Modal
        visible={!!preview}
        transparent
        animationType="slide"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: "90%" }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalTypeBadge}>
                  <Text style={styles.modalTypeBadgeText}>
                    {getTypeLabel(previewFileType ?? "")}
                  </Text>
                </View>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {previewFileName}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setPreview(null)}
              >
                <Text style={{ fontSize: 14, color: "#5F5E5A" }}>✕</Text>
              </Pressable>
            </View>

            {/* Body */}
            <View style={styles.modalBody}>
              <PreviewContent
                fileType={previewFileType ?? ""}
                fileUrl={previewFileUrl}
                localUri={previewLocalUri}
                fileName={previewFileName}
              />
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.btnGhost, { flex: 1 }]}
                onPress={() => setPreview(null)}
              >
                <Text style={styles.btnGhostText}>Close</Text>
              </Pressable>

              {preview?.type === "uploaded" && (
                <Pressable
                  style={[styles.btnPrimary, { flex: 1 }]}
                  onPress={() => handleDownload(previewItem)}
                >
                  <Text style={styles.btnPrimaryText}>⬇️ Download</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════ DELETE MODAL ═══════════ */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Delete Document</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={{ fontSize: 14, color: "#5F5E5A" }}>✕</Text>
              </Pressable>
            </View>

            {/* Body */}
            <View style={styles.delModalBody}>
              <View style={styles.delIconRing}>
                <View style={styles.delIconInner}>
                  <Text style={{ fontSize: 22 }}>🗑️</Text>
                </View>
              </View>

              <Text style={styles.delTitle}>Permanently delete?</Text>
              <Text style={styles.delDesc}>
                This will permanently delete{" "}
                <Text style={styles.delFileName}>
                  "{deleteTarget?.originalName}"
                </Text>
                . This action cannot be undone.
              </Text>

              {deleteTarget && (
                <View style={styles.delFilePill}>
                  <Text style={styles.delFilePillIcon}>
                    {isImage(deleteTarget.fileType)
                      ? "🖼"
                      : isPdf(deleteTarget.fileType)
                      ? "📄"
                      : isWord(deleteTarget.fileType)
                      ? "📝"
                      : "📁"}
                  </Text>
                  <Text style={styles.delFilePillName} numberOfLines={1}>
                    {deleteTarget.originalName}
                  </Text>
                  <View style={styles.delFilePillBadge}>
                    <Text style={styles.delFilePillBadgeText}>
                      {getTypeLabel(deleteTarget.fileType)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.delFooter}>
              <Pressable
                style={[styles.btnGhost, { flex: 1 }]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btnDanger, { flex: 1 }]}
                onPress={handleDelete}
              >
                <Text style={styles.btnDangerText}>🗑️  Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>Back</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default PatientReports;

// ─────────────── styles ───────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F6",
    padding: 16,
    paddingBottom: 80,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1A1A18" },
  headerSub: { fontSize: 13, color: "#888780", marginTop: 2 },
  uploadBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#B4B2A9",
    backgroundColor: "#FFFFFF",
  },
  uploadBtnText: { fontSize: 13, fontWeight: "500", color: "#1A1A18" },

  // Staged area
  stagedArea: {
    backgroundColor: "#F1EFE8",
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  stagedLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888780",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  stagedFile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 6,
    gap: 8,
  },
  stagedFileMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stagedFileIcon: { fontSize: 20 },
  stagedFileName: { fontSize: 13, color: "#1A1A18", fontWeight: "500" },
  stagedFileSize: { fontSize: 11, color: "#888780", marginTop: 1 },
  stagedFileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stagedPreviewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#185FA5",
    backgroundColor: "#EBF2FB",
  },
  stagedPreviewText: { fontSize: 11, fontWeight: "500", color: "#185FA5" },
  stagedRemove: { fontSize: 14, color: "#888780", paddingHorizontal: 4 },
  stagedActions: { flexDirection: "row", gap: 8, marginTop: 10 },

  // Buttons
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A18",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: "500", color: "#FFFFFF" },
  btnGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0.5,
    borderColor: "#B4B2A9",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  btnGhostText: { fontSize: 13, color: "#5F5E5A" },
  btnDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCEBEB",
    borderWidth: 0.5,
    borderColor: "#F7C1C1",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  btnDangerText: { fontSize: 13, fontWeight: "600", color: "#A32D2D" },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888780",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  columnWrapper: { gap: 10 },

  // Card
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  thumb: {
    height: 100,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#D3D1C7",
  },
  fileIcon: { fontSize: 30 },
  img: { width: "100%", height: "100%" },
  typeBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#B4B2A9",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#5F5E5A",
    letterSpacing: 0.4,
  },
  cardBody: { padding: 9 },
  title: { fontSize: 12, fontWeight: "500", color: "#1A1A18", marginBottom: 3 },
  sub: { fontSize: 10, color: "#888780" },
  row: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#D3D1C7",
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
  },
  actionDivider: { width: 0.5, backgroundColor: "#D3D1C7" },
  actionView: { fontSize: 11, fontWeight: "500", color: "#185FA5" },
  actionDownload: { fontSize: 11, fontWeight: "500", color: "#1C6B3A" },
  actionDelete: { fontSize: 11, fontWeight: "500", color: "#A32D2D" },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#888780" },
  emptyHint: { fontSize: 11, color: "#B4B2A9", marginTop: 4 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#B4B2A9",
    borderRadius: 14,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#D3D1C7",
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  modalTypeBadge: {
    backgroundColor: "#F1EFE8",
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modalTypeBadgeText: { fontSize: 10, fontWeight: "600", color: "#5F5E5A" },
  modalHeaderTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A18",
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#B4B2A9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { padding: 14 },
  modalPreviewImg: {
    width: "100%",
    height: 240,
    borderRadius: 8,
    backgroundColor: "#F1EFE8",
  },
  webviewWrap: {
    height: 440,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F8F8F6",
  },
  docPlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: "#F1EFE8",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  docPlaceholderTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A18",
    textAlign: "center",
  },
  docPlaceholderSub: { fontSize: 12, color: "#888780", textAlign: "center" },
  modalFooter: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#D3D1C7",
  },

  // Delete modal
  delModalBody: {
    padding: 20,
    alignItems: "flex-start",
  },
  delIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FEE4E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  delIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  delTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A18",
    marginBottom: 6,
  },
  delDesc: { fontSize: 13, color: "#888780", lineHeight: 20, marginBottom: 14 },
  delFileName: { fontWeight: "500", color: "#5F5E5A" },
  delFilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F8F6",
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: "100%",
  },
  delFilePillIcon: { fontSize: 16 },
  delFilePillName: {
    flex: 1,
    fontSize: 12,
    color: "#1A1A18",
    fontWeight: "500",
  },
  delFilePillBadge: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#B4B2A9",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  delFilePillBadgeText: { fontSize: 9, fontWeight: "600", color: "#5F5E5A" },
  delFooter: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#D3D1C7",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#D3D1C7",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  cancelBtn: {
    backgroundColor: "#ccc",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginRight: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(48),
  },
  cancelBtnText: {
    color: "#000",
    fontWeight: "500",
    fontSize: responsiveText(FONT_SIZE.md),
  },
  nextBtn: {
    backgroundColor: "#007bff",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginLeft: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(48),
  },
  nextBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: responsiveText(FONT_SIZE.md),
  },
  pdfContainer: {
    height: 500,
    width: "100%",
    backgroundColor: "#F8F8F6",
    borderRadius: 8,
    overflow: "hidden",
  },
  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  pdfLoader: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },

  // Simple Pagination
  paginationSimple: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  paginationSimpleText: {
    fontSize: 12,
    color: "#5F5E5A",
    fontWeight: "500",
  },
  paginationSimpleButtons: {
    flexDirection: "row",
    gap: 10,
  },
  paginationSimpleBtn: {
    fontSize: 11,
    color: "#185FA5",
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});