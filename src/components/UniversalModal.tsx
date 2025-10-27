import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AccessibilityInfo,
  findNodeHandle,
  AccessibilityRole,
} from 'react-native';
import { Icon } from 'react-native-elements';

type ModalKind = 'info' | 'success' | 'warning' | 'error' | 'confirm';

type ButtonDef = {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  testID?: string;
};

export type UniversalModalProps = {
  visible: boolean;
  kind?: ModalKind;
  title?: string;
  message?: string;
  children?: React.ReactNode;

  primaryButton?: ButtonDef;
  secondaryButton?: ButtonDef;

  dismissible?: boolean;
  onRequestClose?: () => void;

  theme?: Partial<typeof defaultTheme>;
};

const defaultTheme = {
  // Dark theme to match your dashboard
  overlay: 'rgba(2,6,12,0.55)',
  cardBg: '#0F172A',
  cardBorder: '#1E293B',
  title: '#E5E7EB',
  text: '#94A3B8',
  // accents
  primaryBg: '#7DD3FC',
  primaryText: '#0B1220',
  secondaryBg: 'transparent',
  secondaryText: '#E5E7EB',
  secondaryBorder: '#2A3446',
  destructiveBg: '#EF4444',
  destructiveText: '#0B1220',
  // icon tints
  info: '#93C5FD',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

const kindIcon: Record<ModalKind, { name: string; type?: string }> = {
  info:    { name: 'info-circle', type: 'font-awesome' },
  success: { name: 'check-circle', type: 'font-awesome' },
  warning: { name: 'exclamation-triangle', type: 'font-awesome' },
  error:   { name: 'times-circle', type: 'font-awesome' },
  confirm: { name: 'help-circle', type: 'feather' },
};

const UniversalModal: React.FC<UniversalModalProps> = ({
  visible,
  kind = 'info',
  title = '',
  message = '',
  children,
  primaryButton,
  secondaryButton,
  dismissible = true,
  onRequestClose,
  theme,
}) => {
  const t = { ...defaultTheme, ...(theme || {}) };
  const cardRef = useRef<View>(null);

  // Use 'alert' role only for critical/dismissal-blocking cases
  const a11yRole: AccessibilityRole | undefined =
    kind === 'error' || kind === 'warning' || kind === 'confirm' ? 'alert' : undefined;

  useEffect(() => {
    if (visible && cardRef.current) {
      const tag = findNodeHandle(cardRef.current);
      if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View
        style={[styles.overlay, { backgroundColor: t.overlay }]}
        accessibilityLabel={title || kind}
      >
        <TouchableOpacity
          accessible={false}
          activeOpacity={1}
          style={styles.scrim}
          onPress={dismissible ? onRequestClose : undefined}
        />

        <View
          ref={cardRef}
          style={[
            styles.card,
            { backgroundColor: t.cardBg, borderColor: t.cardBorder },
          ]}
          accessibilityRole={a11yRole}
          accessible
          accessibilityViewIsModal
          importantForAccessibility="yes"
          accessibilityLabel={title}
          accessibilityHint={primaryButton?.text ? `Action: ${primaryButton.text}` : undefined}
        >
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Icon
                {...kindIcon[kind]}
                size={28}
                color={
                  kind === 'success'
                    ? t.success
                    : kind === 'warning'
                    ? t.warning
                    : kind === 'error'
                    ? t.error
                    : kind === 'confirm'
                    ? t.info
                    : t.info
                }
              />
            </View>
            {!!title && <Text style={[styles.title, { color: t.title }]}>{title}</Text>}
          </View>

          <View style={styles.body}>
            {children ? (
              children
            ) : !!message ? (
              <Text style={[styles.message, { color: t.text }]}>{message}</Text>
            ) : null}
          </View>

          {(primaryButton || secondaryButton) && (
            <View style={styles.footer}>
              {secondaryButton && (
                <ModalButton {...secondaryButton} theme={t} defaultVariant="secondary" />
              )}
              {primaryButton && (
                <ModalButton {...primaryButton} theme={t} defaultVariant="primary" />
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const ModalButton: React.FC<
  ButtonDef & { theme: typeof defaultTheme; defaultVariant: 'primary' | 'secondary' }
> = ({ text, onPress, variant, theme: t, testID, defaultVariant }) => {
  const v = variant || defaultVariant;
  const isDestructive = v === 'destructive';
  const bg =
    v === 'primary'
      ? t.primaryBg
      : isDestructive
      ? t.destructiveBg
      : t.secondaryBg;
  const color =
    v === 'primary'
      ? t.primaryText
      : isDestructive
      ? t.destructiveText
      : t.secondaryText;
  const borderColor = v === 'secondary' ? t.secondaryBorder : 'transparent';

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.btn, { backgroundColor: bg, borderColor }]}
    >
      <Text style={[styles.btnText, { color }]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: Platform.select({ ios: 0.25, android: 0.35 }) as number,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.08)',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  body: {
    marginTop: 8,
    marginBottom: 14,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    minWidth: 110,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

export default UniversalModal;